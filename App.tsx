import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clan, TrackedClan } from './types';
import Leaderboard from './components/Leaderboard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini AI Client.
// The API key is expected to be available in the environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const REFRESH_INTERVAL_MS = 10000; // 10 seconds
// A CORS proxy is used because the territorial.io API does not send Access-Control-Allow-Origin headers.
const API_URL = 'https://corsproxy.io/?https://territorial.io/clans';

const App: React.FC = () => {
  const [clans, setClans] = useState<TrackedClan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const previousClansMap = useRef<Map<string, Clan>>(new Map());
  const intervalRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch the raw text from the territorial.io endpoint via a CORS proxy.
      // Added { cache: 'no-cache' } to prevent stale data from being served.
      const response = await fetch(API_URL, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Network response was not ok. Status: ${response.status}`);
      }
      const responseText = await response.text();
      
      // 2. Define a simplified schema focused only on clan name and score.
      const schema = {
        type: Type.ARRAY,
        description: "A list of clans from the leaderboard with their scores.",
        items: {
            type: Type.OBJECT,
            description: "A single clan's data.",
            properties: {
                name: { type: Type.STRING, description: "The full name of the clan." },
                score: { type: Type.NUMBER, description: "The clan's total score." }
            },
            required: ["name", "score"]
        }
      };

      // 3. Use Gemini to parse the unstructured text, focusing only on name and score.
      const modelResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Parse the following text from the territorial.io all-time clans leaderboard. The text is a ranked list of clans with their scores. Your task is to extract every clan and its score. Return a clean JSON array of objects, with each object containing 'name' and 'score'.

          Text:
          """
          ${responseText}
          """
          `,
          config: {
              responseMimeType: "application/json",
              responseSchema: schema,
              systemInstruction: "You are an expert data extraction assistant. Your task is to parse unstructured text from a game's leaderboard, which may contain extraneous information. Convert it into a structured JSON array containing objects with 'name' and 'score' fields. You must be thorough and extract all clans mentioned. You must only return the JSON data."
          }
      });

      const jsonString = modelResponse.text;
      if (!jsonString) {
        throw new Error("AI model returned an empty response.");
      }
      
      const newClansData: Clan[] = JSON.parse(jsonString);
      
      // De-duplicate the data based on clan name to ensure a clean list.
      const uniqueClansMap = new Map<string, Clan>();
      for (const clan of newClansData) {
          if (!uniqueClansMap.has(clan.name)) {
              uniqueClansMap.set(clan.name, clan);
          }
      }
      const uniqueClans = Array.from(uniqueClansMap.values());

      // Calculate point changes for each clan.
      const trackedClans = uniqueClans.map(clan => {
          const previousClan = previousClansMap.current.get(clan.name);
          // If a clan existed previously, calculate the change. Otherwise, the change is 0.
          const pointChange = previousClan ? clan.score - previousClan.score : 0;
          return { ...clan, pointChange };
      });
      
      // Sort by score and update the state.
      const sortedData = trackedClans.sort((a, b) => b.score - a.score);
      
      // If we had an error before and it's now resolved, clear it.
      if (error) setError(null);
      setClans(sortedData);

      // Update the reference map for the next fetch cycle.
      previousClansMap.current = new Map(uniqueClans.map(c => [c.name, c]));
      
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to fetch and process clan data:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      const lowerCaseError = errorMessage.toLowerCase();

      if (lowerCaseError.includes('quota')) {
        setError('Daily Gemini API quota exceeded. Live updates have been paused. Please check back tomorrow.');
        stopPolling();
      } else if (lowerCaseError.includes('api key not valid')) {
        setError('Failed to process data: The Gemini API key is missing or invalid. Please ensure it is configured correctly.');
        stopPolling();
      } else {
         setError(`Failed to process data with AI: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, [stopPolling, error]);

  useEffect(() => {
    fetchData(); // Initial fetch
    intervalRef.current = window.setInterval(fetchData, REFRESH_INTERVAL_MS);

    return () => stopPolling(); // Cleanup on unmount
  }, [fetchData, stopPolling]);

  return (
    <div className="min-h-screen bg-[#0D0221] text-gray-200 p-4 sm:p-6 lg:p-8">
      <main className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 
            className="text-5xl sm:text-6xl font-bold text-cyan-300 relative inline-block"
            style={{ textShadow: '3px 3px 0px #F472B6, 6px 6px 0px #8B5CF6' }}
          >
            Territorial.io Clan Leaderboard
          </h1>
          <p className="text-pink-400 mt-4 text-lg">
            Live rankings powered by Gemini
          </p>
          {lastUpdated && !loading && !error && (
             <p className="text-sm text-purple-400 mt-2">
                Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </header>
        
        <div className="bg-[#1D1137] p-1 border-2 border-t-gray-300 border-l-gray-300 border-b-gray-600 border-r-gray-600">
          <div className="bg-[#0D0221] p-4 sm:p-6 border-2 border-t-gray-600 border-l-gray-600 border-b-gray-300 border-r-gray-300">
            {loading && clans.length === 0 ? (
              <LoadingSpinner />
            ) : error ? (
              <ErrorDisplay message={error} />
            ) : (
              <Leaderboard data={clans} isLoading={loading && clans.length > 0} />
            )}
          </div>
        </div>
        <footer className="text-center mt-8 text-purple-400 text-sm">
            <p>Data sourced from territorial.io. This is an unofficial project.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
