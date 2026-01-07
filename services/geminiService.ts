
import { GoogleGenAI, Type } from "@google/genai";
import { LogLevel, Vulnerability } from "../types";

// Since this is a browser environment, we simulate the backend Puppeteer/Crawler logic 
// by using Gemini to hallucinate the specific technical logs and findings based on the target.
// In a real deployment, this service would be the "Intelligence" layer analyzing raw HTML.

// Correctly initialized with a named parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are the kernel of an elite automated security agent named "Sentinel". 
Your job is to generate realistic, highly technical, and slightly cyberpunk execution logs 
for a security audit. You understand Puppeteer, SQL Injection, XSS, and Network protocols deeply.
Output must be raw data, no conversational filler.
`;

export const analyzeTargetForSimulation = async (targetUrl: string): Promise<{
    logs: { level: LogLevel; message: string; module: 'CRAWLER' | 'DAST' | 'FORM_BOT' | 'CORE' }[];
    vulnerabilities: Omit<Vulnerability, 'id'>[];
}> => {
    
    // We request a structured simulation of a scan
    const prompt = `
    Simulate a 30-second slice of a high-speed security crawl and audit on: ${targetUrl}.
    
    The target is a hypothetical implementation of this domain. 
    If the domain is generic (e.g., example.com), invent a "Corp Enterprise" structure for it.
    
    Return a JSON object with two arrays:
    1. 'logs': 12-15 specific technical log entries. varying modules (CRAWLER, DAST, FORM_BOT).
       - CRAWLER: visiting paths, bypassing WAF (Cloudflare/Akamai), handling cookies.
       - FORM_BOT: detecting input[name='email'], injecting heuristical data.
       - DAST: testing payloads ( ' OR 1=1 -- ), checking timings.
    2. 'vulnerabilities': 1-3 plausible vulnerabilities found (or empty if unlikely).
       - XSS in search bars, SQLi in ID parameters, exposed .env files.
    
    Make it sound like an elite hacker tool output.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        logs: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    level: { type: Type.STRING, enum: ['INFO', 'WARN', 'ERROR', 'SUCCESS', 'SYSTEM'] },
                                    message: { type: Type.STRING },
                                    module: { type: Type.STRING, enum: ['CRAWLER', 'DAST', 'FORM_BOT', 'CORE'] }
                                }
                            }
                        },
                        vulnerabilities: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING },
                                    severity: { type: Type.STRING, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
                                    description: { type: Type.STRING },
                                    location: { type: Type.STRING },
                                    payload_used: { type: Type.STRING }
                                }
                            }
                        }
                    },
                    propertyOrdering: ["logs", "vulnerabilities"]
                }
            }
        });

        // Use .text property instead of .text()
        const text = response.text;
        if (text) {
             // Sanitize: Remove Markdown code blocks if present
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        }
        return { logs: [], vulnerabilities: [] };

    } catch (e) {
        console.error("Gemini Simulation Failed", e);
        // Fallback mock data in case of API failure to keep the app feeling "alive"
        return {
            logs: [
                { level: LogLevel.ERROR, message: "Gemini Uplink Failed. Reverting to local heuristics.", module: 'CORE' },
                { level: LogLevel.WARN, message: "Connection unstable. Retrying handshake...", module: 'CRAWLER' },
                { level: LogLevel.INFO, message: "Falling back to offline simulation database...", module: 'CORE' },
                { level: LogLevel.WARN, message: "Simulating scan for " + targetUrl, module: 'CORE' },
                { level: LogLevel.INFO, message: "GET /login [200 OK] - 45ms", module: 'CRAWLER' },
                { level: LogLevel.INFO, message: "Found input[name='username']", module: 'FORM_BOT' },
                { level: LogLevel.INFO, message: "Testing payload: ' OR 1=1 --", module: 'DAST' }
            ],
            vulnerabilities: []
        };
    }
};

export const analyzeCodeSnippet = async (code: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Analyze this code snippet for security vulnerabilities. Provide a concise, bulleted markdown report focusing on critical risks like Injection, Auth bypass, or XSS.\n\nCode:\n${code}`,
            config: {
                systemInstruction: "You are a Static Application Security Testing (SAST) engine."
            }
        });
        // Use .text property instead of .text()
        return response.text || "No analysis generated.";
    } catch (e) {
        console.error("Code Analysis Failed", e);
        return "Error analyzing code snippet. Ensure API Key is valid.";
    }
}
