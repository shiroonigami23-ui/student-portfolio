const API_KEY = 'AIzaSyBdsaHzE7dMvYKmurEfiqMtnk0Fb-12dwk'; 

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

const systemInstruction = {
    parts: [{
        text: `You are an expert Career Counselor and Portfolio Architect, specifically assisting 3rd-year B.Tech students from Rustamji Institute of Technology (RJIT), Tekanpur, India. Your primary goal is to help them create a perfect, professional portfolio that stands out to recruiters, even with limited formal work experience.

        **Core Directives:**
        1.  **Persona:** Maintain a supportive, expert, and encouraging tone.
        2.  **Context:** Understand that users are engineering students. Their 'experience' is primarily academic projects, internships, workshops, and technical skills learned in their curriculum (C++, Java, Python, Web Dev, etc.).
        3.  **Action Verbs:** ALWAYS use strong, professional action verbs (e.g., "Engineered," "Developed," "Implemented," "Analyzed," "Optimized," "Collaborated"). Avoid passive language.
        4.  **Quantify Results:** Whenever possible, frame descriptions in terms of measurable outcomes (e.g., "...resulting in a 15% reduction in load time," or "...which handled over 100 concurrent requests."). If a number isn't available, focus on the impact.
        5.  **Project Focus:** Frame academic projects like professional work. Clearly state the problem, the technologies used (tech stack), and the outcome or learning.
        6.  **Directness:** Never use conversational filler or introductory phrases like "Here is the rewritten text:" or "Certainly, here is a draft:". Respond only with the requested content in the specified format.`
    }]
};



async function callGeminiApi(payload) {
    if (!API_KEY || API_KEY.includes('PASTE_YOUR')) {
        throw new Error("AI feature is not configured. Please add your Google Gemini API key in ai.js.");
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // The complete payload, including the system instruction, is now passed in.
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API call failed: ${errorData.error.message}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const responseText = candidate?.content?.parts?.[0]?.text;
        
        if (responseText) {
            return responseText;
        } else {
            throw new Error("Could not extract valid text from the API response.");
        }

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw error;
    }
}


export function improveWriting(text) {
    const prompt = `Rewrite the following text to be more professional, clear, and impactful for an engineering student's portfolio. Enhance the language and tone.\n\nOriginal Text:\n"${text}"`;
    
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: systemInstruction
    };
    
    return callGeminiApi(payload);
}


export function generateBulletPoints(text) {
    const prompt = `Convert the following description into a series of professional, accomplishment-oriented bullet points suitable for a B.Tech student's resume. Use Markdown for the bullet points (e.g., "* Engineered a REST API...").\n\nOriginal Text:\n"${text}"`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: systemInstruction
    };

    return callGeminiApi(payload);
}


export async function generateFirstDraft(role) {
    const prompt = `Generate a complete, high-quality portfolio draft for a 3rd-year B.Tech student from RJIT, Tekanpur, whose target role is: "${role}".
    
    The draft must be realistic for a student with no formal job experience but with solid academic projects.
    - Create a professional summary.
    - Invent 1-2 relevant work/internship experiences (if plausible for a 3rd-year student) or a key 'Position of Responsibility' in a college club.
    - Invent a realistic B.Tech education entry for RJIT.
    - List 8-10 relevant technical skills.
    - Invent 2-3 detailed and impressive-sounding academic projects with clear descriptions, technologies used, and outcomes.
    
    Return the output as a single, clean JSON object. Do not wrap it in markdown backticks.`;

    const schema = {
        type: "OBJECT",
        properties: {
            "portfolioTitle": { "type": "STRING" },
            "firstName": { "type": "STRING" },
            "lastName": { "type": "STRING" },
            "email": { "type": "STRING" },
            "summary": { "type": "STRING" },
            "experience": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "title": { "type": "STRING" },
                        "company": { "type": "STRING" },
                        "dates": { "type": "STRING" },
                        "description": { "type": "STRING" }
                    }
                }
            },
            "education": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "degree": { "type": "STRING" },
                        "institution": { "type": "STRING" },
                        "year": { "type": "STRING" }
                    }
                }
            },
            "skills": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "name": { "type": "STRING" },
                        "level": { "type": "STRING", "enum": ["Novice", "Intermediate", "Advanced", "Expert"] }
                    }
                }
            },
            "projects": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "title": { "type": "STRING" },
                        "description": { "type": "STRING" },
                        "technologies": { "type": "STRING" },
                        "liveUrl": { "type": "STRING" },
                        "repoUrl": { "type": "STRING" }
                    }
                }
            }
        }
    };

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: systemInstruction,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    };
    
    const jsonString = await callGeminiApi(payload);
    return JSON.parse(jsonString);
}
