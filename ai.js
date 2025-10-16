
// HOW TO GET A KEY:
// 1. Go to Google AI Studio: https://aistudio.google.com/
// 2. Click "Get API key" and create a new key.
// 3. Copy the key and paste it below.

const API_KEY = 'AIzaSyBSIOzrKMkXlYBFxzGWOFYdbb9mF1TsOEo'; // <--- PASTE YOUR KEY HERE

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

/**
 * A generic function to call the Gemini API.
 * @param {string} prompt - The full prompt to send to the model.
 * @returns {Promise<string>} The generated text from the model.
 */
async function callGeminiApi(prompt) {
    if (!API_KEY || API_KEY === 'PASTE_YOUR_GOOGLE_GEMINI_API_KEY_HERE') {
        return "AI feature is not configured. Please add your Google Gemini API key in ai.js.";
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error Response:", errorData);
            throw new Error(`API call failed: ${errorData.error.message}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        
        if (candidate && candidate.content?.parts?.[0]?.text) {
            return candidate.content.parts[0].text;
        } else {
            console.error("Invalid response structure:", data);
            throw new Error("Could not extract text from the API response.");
        }

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return `Sorry, there was an error: ${error.message}`;
    }
}

/**
 * Generates a prompt to improve existing text.
 * @param {string} text - The user's original text.
 * @returns {Promise<string>} The improved text.
 */
export function improveWriting(text) {
    const prompt = `Rewrite the following text to be more professional, clear, and impactful for a resume or portfolio. Keep the core meaning intact but enhance the language and tone. Do not add any introductory phrases like "Here is the rewritten text:". Just provide the improved text directly.\n\nOriginal Text:\n"${text}"`;
    return callGeminiApi(prompt);
}

/**
 * Generates a prompt to convert text into bullet points.
 * @param {string} text - The user's original text.
 * @returns {Promise<string>} The text converted into Markdown bullet points.
 */
export function generateBulletPoints(text) {
    const prompt = `Convert the following description into a series of professional, accomplishment-oriented bullet points suitable for a resume. Use Markdown for the bullet points (e.g., "* Managed a team..."). Do not add any introductory phrases. Just provide the bullet points directly.\n\nOriginal Text:\n"${text}"`;
    return callGeminiApi(prompt);
}
