const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI;

// MongoClient 인스턴스를 함수 밖에 생성하여 연결을 재사용합니다.
const client = new MongoClient(uri);

module.exports = async function (context, req) {
    context.log('Login function processed a request.');

    const { id, password } = req.body;

    if (!id || !password) {
        context.res = {
            status: 400,
            body: { error: 'ID and password are required.' }
        };
        return;
    }

    try {
        // DB 연결이 없을 때만 새로 연결합니다.
        if (!client.topology || !client.topology.isConnected()) {
            await client.connect();
        }

        const database = client.db("users"); // 'users' 데이터베이스 사용
        const collection = database.collection("userinfo");

        // 아이디로 사용자 찾기
        const user = await collection.findOne({ id: id });

        // 사용자가 없거나 비밀번호가 틀린 경우
        if (!user || user.password !== password) {
            context.res = {
                status: 401, // 401: Unauthorized (인증 실패)
                body: { error: '아이디 또는 비밀번호가 올바르지 않습니다.' }
            };
            return;
        }

        // 로그인 성공: 사용자 정보에서 비밀번호를 제외하고 반환합니다.
        context.res = {
            status: 200,
            body: {
                id: user.id,
                nickname: user.nickname
            }
        };

    } catch (error) {
        context.log.error(error);
        context.res = {
            status: 500,
            body: { error: 'Server error during login.' }
        };
    }
};