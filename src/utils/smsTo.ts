import axios from 'axios';

export const sendSmsTo = async (to: string, message: string) => {
    const apiKey = process.env.SMSTO_API_KEY;
    try {
        const res = await axios.post(
            'https://api.sms.to/sms/send',
            {
                message,
                to,
                sender_id: 'SMSto'
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('sms.to response:', res.data);
        return res.data;
    } catch (err: any) {
        console.error('sms.to error:', err.response?.data || err.message);
        throw err;
    }
};
