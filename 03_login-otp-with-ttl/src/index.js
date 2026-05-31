import express from 'express';
import Redis from 'ioredis';

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');


function otpkey(phone){
    return `otp:${phone}`;
}

app.post('/send-otp', async (req, res) => {
    const phone = req.body.phone;
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP

    //store otp in redis with ttl of 1 minutes
    await redis.set(otpkey(phone), otp, 'EX', 60); //EX sets the expiration time in seconds
    res.json({message: 'OTP sent successfully', otp}); // In production, you would send the OTP via SMS instead of returning it in the response

});


app.post('/otp/verify', async (req, res) => {
    const {phone, otp} = req.body;
    const savedOtp = await redis.get(otpkey(phone));

    console.log({ phone, otp, savedOtp });


    if(!savedOtp){
        return res.status(400).json({message: 'OTP expired or not found'});
    }

    if(savedOtp !== otp){
        return res.status(400).json({message: 'Invalid otp'});
    }

    await redis.del(otpkey(phone)); //delete the otp after successful verification

     return res.status(200).json({
        message: 'OTP verified successfully'
    });
});

app.get('/otp/:phone/ttl', async (req, res) => {
    const ttl = await redis.ttl(otpkey(req.params.phone));
    res.json({ttl});
});


app.listen(3000, () => {
    console.log('server is running on port 3000');
})
