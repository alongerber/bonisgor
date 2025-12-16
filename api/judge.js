export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'API key not configured' });

    try {
        const { context, sideA, sideB } = req.body;
        const contextLabels = { couple: 'זוג', roommates: 'שותפים לדירה', family: 'משפחה', work: 'עבודה' };

        const prompt = `אתה שופט סרקסטי בבית הדין לקטנוניות.
הקשר: ${contextLabels[context] || 'כללי'}
צד א: ${sideA}
צד ב: ${sideB}
החזר JSON בלבד: {"winner": "צד א/ב/שניהם צודקים/שניהם טועים", "pettyScore": 0-100, "verdict": "פסק דין מצחיק", "punishment": "עונש יצירתי"}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.9, maxOutputTokens: 1024 }
                })
            }
        );

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text?.startsWith('```')) text = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();

        return res.status(200).json(JSON.parse(text));
    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
}
