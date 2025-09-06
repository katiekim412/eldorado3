// GetRandomMessage/index.js
// CommonJS 기준

const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
console.log('MONGODB_URI exists?', typeof uri, !!uri);
if (!uri || typeof uri !== 'string') {
  throw new Error('MONGODB_URI env not set (check key name and local.settings.json)');
}

// Cosmos for Mongo 포함 최신 드라이버에 맞춘 옵션(안전 권장)
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

// 함수 인스턴스 생명주기 동안 재사용
let connected = false;

module.exports = async function (context, req) {
  try {
    // 최초 1회만 connect + ping
    if (!connected) {
      await client.connect();
      await client.db('admin').command({ ping: 1 });
      connected = true;
      context.log('MongoDB connection established (ping ok)');
    }

    // mood는 query 또는 body에서 허용
    const mood = (req.query && req.query.mood) || (req.body && req.body.mood);
    if (!mood || (mood !== 'good' && mood !== 'bad')) {
      context.res = {
        status: 400,
        body: { error: 'A valid mood (good or bad) is required.' }
      };
      return;
    }

    const db = client.db('wisesaying'); // 실제 DB 이름 사용
    const collectionName = mood === 'good' ? 'emotion_good' : 'emotion_bad';
    const col = db.collection(collectionName);

    // 먼저 $sample 시도 → Cosmos/버전 이슈로 미지원일 경우 skip로 폴백
    let doc = null;

    try {
      const sampled = await col
        .aggregate([{ $sample: { size: 1 } }, { $project: { _id: 0, content: 1 } }])
        .toArray();

      if (sampled.length > 0) {
        doc = sampled[0];
      }
    } catch (aggErr) {
      // 폴백: estimatedDocumentCount → skip/limit
      context.log(`[INFO] $sample not available, fallback to skip: ${aggErr.message}`);

      const count = await col.estimatedDocumentCount(); // countDocuments보다 가벼움
      if (!count) {
        context.res = {
          status: 404,
          body: { content: '이런, 지금은 드릴 메시지가 없네요.' }
        };
        return;
      }

      const randomIndex = Math.floor(Math.random() * count);
      context.log(`[DEBUG] Total documents: ${count}, Random index: ${randomIndex}`);

      const arr = await col
        .find({}, { projection: { _id: 0, content: 1 } })
        .skip(randomIndex)
        .limit(1)
        .toArray();

      if (arr.length > 0) {
        doc = arr[0];
      }
    }

    if (!doc) {
      context.res = {
        status: 404,
        body: { content: '메시지를 찾는 데 실패했어요. 다시 시도해주세요.' }
      };
      return;
    }

    context.res = {
      status: 200,
      body: { content: doc.content }
    };
  } catch (error) {
    context.log.error(error);
    context.res = {
      status: 500,
      body: { error: 'Server error while fetching message.' }
    };
  }
  // 주의: 여기서 client.close() 하지 마세요. (연결 재사용)
};
