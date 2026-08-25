export const SCRIPT_ENDPOINT_PATH = "/api/public/script";

// Sentinel value stored in allowed_games.script_url for paid games.
// When the script API sees this, it serves PAID_SCRIPT_LOADER instead of fetching a URL.
export const PAID_SCRIPT_SENTINEL = "lovable:paid-loader";

// Sentinel for games that have been disabled in the admin UI.
// Returned to the client as a normal allowed session, but the script body
// served is the lightweight MainLoader1 fallback below.
export const DISABLED_SCRIPT_SENTINEL = "lovable:disabled-loader";

export const DISABLED_SCRIPT_LOADER = `loadstring(game:HttpGet("https://raw.githubusercontent.com/checkurasshole/INK/refs/heads/main/exist"))()`;

// The WicksShop loader served to every paid game (mirrors the original site).
export const PAID_SCRIPT_LOADER = `local moduleUrl = "https://raw.githubusercontent.com/checkurasshole/INK/main/WicksModule.lua"
local success, result = pcall(function()
	return loadstring(game:HttpGet(moduleUrl, true))()
end)
if success and result and result.Load then
	result.Load()
else
	warn("WicksShop: Failed to load module")
end`;

// Known free-script URL bundle imported from the original combo-scripts website.
// Extend this list as you recover more mappings.
export const KNOWN_FREE_SCRIPTS: Record<string, string> = {
  "11653088948": "https://raw.githubusercontent.com/checkurasshole/Script/refs/heads/main/TestScript",
  "14518422161": "https://raw.githubusercontent.com/checkurasshole/Script/refs/heads/main/Hitbox%20Gunfight%20Arena",
  "142823291": "https://raw.githubusercontent.com/checkurasshole/Script/refs/heads/main/mur2",
};

export const SCRIPT_CONTENT = `-- Your protected Lua script
print("Authenticated script loaded")
`;