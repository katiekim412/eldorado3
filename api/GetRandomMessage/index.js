const { MongoClient } = require('mongodb');

// DB 연결 문자열은 Azure Portal의 '구성(Configuration)' -> '응용 프로그램 설정'에
// MONGO_URI 라는 이름으로 저장해야 합니다. 코드에 직접 노출하지 않습니다.
const uri = process.env.MONGO_URI;

// MongoClient 인스턴스를 함수 밖에 생성하여 연결을 재사용합니다.
const client = new MongoClient(uri);

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const mood = req.query.mood;

    if (!mood || (mood !== 'good' && mood !== 'bad')) {
        context.res = {
            status: 400,
            body: { error: 'A valid mood (good or bad) is required.' }
        };
        return;
    }

    try {
      
        await client.connect();
        const database = client.db("wisesaying");
        
        const collectionName = mood === 'good' ? 'emotion_good' : 'emotion_bad';
        const collection = database.collection(collectionName);

        // 1. 컬렉션의 전체 문서 수를 가져옵니다.
        const count = await collection.countDocuments();

        if (count === 0) {
            context.res = {
                status: 404,
                body: { content: '이런, 지금은 드릴 메시지가 없네요.' }
            };
            return;
        }

        // 2. 0부터 (count - 1) 사이의 랜덤한 인덱스를 생성합니다.
        const randomIndex = Math.floor(Math.random() * count);
        context.log(`[DEBUG] Total documents: ${count}, Random index generated: ${randomIndex}`);

        // 3. 랜덤 인덱스만큼 건너뛰고 1개의 문서를 가져옵니다.
        const randomItems = await collection.find().skip(randomIndex).limit(1).toArray();
        
        if (randomItems.length === 0) {
            // 이론적으로는 이 오류가 발생하면 안 되지만, 안전장치로 추가합니다.
            context.res = {
                status: 404,
                body: { content: '메시지를 찾는 데 실패했어요. 다시 시도해주세요.' }
            };
            return;
        }

        // 성공 응답
        context.res = {
            body: { content: randomItems[0].content }
        };


    } catch (error) {
        context.log.error(error);
        context.res = {
            status: 500,
            body: { error: 'Server error while fetching message.' }
        };
    } 
};

