import express from 'express';
import Redis from 'ioredis';

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const QUEUE_KEY = 'queue:emails';

app.post('/emails', async (req, res) => {
    const job = {
        to : req.body.to,
        subject : req.body.subject || 'No subject',
        body : req.body.body || 'No body',
        createdAt : new Date().toISOString()
    }

    await redis.lpush(QUEUE_KEY, JSON.stringify(job)); //lpush adds the job to the left of the list, making it a stack (LIFO)
    res.json({queued : true, job});
});

app.get('/emails/process-one', async (req, res) => {
    const rawJob = await redis.rpop(QUEUE_KEY);

    if(!rawJob){
        return res.json({message : 'No jobs in the queue'});
    }

    const job = JSON.parse(rawJob);

    //simulate email sending
    res.json({message : 'Email sent', job});
});

app.listen(3000, () => {
    console.log("server is on running on port 3000");
});