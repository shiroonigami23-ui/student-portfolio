const API_KEY = 'AIzaSyBdsaHzE7dMvYKmurEfiqMtnk0Fb-12dwk'; // <--- YOUR KEY IS ALREADY HERE

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

async function callGeminiApi(prompt, expectJson = false) {
    if (!API_KEY || API_KEY.includes('PASTE')) {
        throw new Error("AI feature is not configured. Please add your Google Gemini API key in ai.js.");
    }

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {}
    };

    if (expectJson) {
        payload.generationConfig.responseMimeType = "application/json";
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
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
        throw error;
    }
}


export function improveWriting(text) {
    const prompt = `Rewrite the following text to be more professional, clear, and impactful for a resume or portfolio. Keep the core meaning intact but enhance the language and tone. Do not add any introductory phrases like "Here is the rewritten text:". Just provide the improved text directly.\n\nOriginal Text:\n"${text}"`;
    return callGeminiApi(prompt);
}


export function generateBulletPoints(text) {
    const prompt = `Convert the following description into a series of professional, accomplishment-oriented bullet points suitable for a resume. Use Markdown for the bullet points (e.g., "* Managed a team..."). Do not add any introductory phrases. Just provide the bullet points directly.\n\nOriginal Text:\n"${text}"`;
    return callGeminiApi(prompt);
}



export async function generateFirstDraft(role) {
    const prompt = `
        You are an expert career coach and resume writer. A user wants to create a portfolio for the role of a "${role}".
        Generate a complete, high-quality, and realistic first draft for their portfolio.
        The content should be impressive and well-written. If the role is for a student or junior, reflect that in the experience level.

        Please respond with ONLY a valid JSON object. Do not include any introductory text or markdown formatting. The JSON object must have the following structure:
        {
          "portfolioTitle": "A suitable title for the portfolio.",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "summary": "A compelling 2-3 sentence professional summary in Markdown format.",
          "experience": [
            {
              "title": "Relevant Job Title",
              "company": "Company Name or University Project",
              "dates": "Month Year - Month Year or Present",
              "description": "A 2-3 point description of responsibilities and achievements in Markdown bullet points."
            }
          ],
          "education": [
            {
              "degree": "Degree or Certificate",
              "institution": "University or School Name",
              "year": "Year of Graduation"
            }
          ],
          "skills": [
            {"name": "Key Skill 1", "level": "Advanced"},
            {"name": "Key Skill 2", "level": "Intermediate"},
            {"name": "Soft Skill 1", "level": "Expert"}
          ],
          "projects": [
            {
              "title": "Impressive Project Title 1",
              "description": "A concise description of the project, its purpose, and the outcome in Markdown format.",
              "technologies": "Comma, separated, list",
              "liveUrl": "https://example.com",
              "repoUrl": "https://github.com/example/repo"
            },
            {
              "title": "Impressive Project Title 2",
              "description": "Another concise project description in Markdown format.",
              "technologies": "Some, other, tech",
              "liveUrl": "https://example.com",
              "repoUrl": "https://github.com/example/repo"
            }
          ]
        }
    `;
    const jsonString = await callGeminiApi(prompt, true);
    try {
        // The AI might return a string wrapped in ```json ... ```, so we clean it.
        const cleanedJsonString = jsonString.replace(/^```json\s*|```$/g, '');
        return JSON.parse(cleanedJsonString);
    } catch (e) {
        console.error("Failed to parse AI response as JSON:", jsonString);
        throw new Error("The AI returned an invalid response. Please try again.");
    }
}
