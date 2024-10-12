This project is a fork of “https://github.com/stackblitz/bolt.new” 🚀.
All rules depend on bolt.new, so be sure to check it out.

This project includes the following points
☑Allows you to choose which LLM to use on the screen
☑The original bolt.new command was for linux environments, so I updated it to work on windows.

Usage:
1. run the following command
```ps:
pnpm install
```

2. Create “.env.local” in the project root and add the following definition
```.env.local
OPENAI_API_KEY=<YOUR OPENAI API KEY>
ANTHROPIC_API_KEY=<YOUR ANTHROPIC API KEY>
OLLAMA_BASE_URL=http://localhost:11434/v1/
VITE_LOG_LEVEL=debug
```

3. Create a llm.json file under the app folder of the project. In llm.json, include the following definitions.
```app/llm.json
[
    {
        "provider": "anthropic",
        "model": "claude-3-5-sonnet-20240620",
        "capt": "Claude 3.5"
    },
    {
        "provider": "openai",
        "model": "gpt-4o",
        "capt": "OpenAI GPT-4o"
    },
    {
        "provider": "ollama",
        "model": "deepseek-coder-v2:16b",
        "capt": "deepseek-coder-v2"
    },
    {
        "provider": "ollama",
        "model": "7shi/ezo-gemma-2-jpn:2b-instruct-q8_0",
        "capt": "ezo-gemma-2-jpn"
    }
]

```

4. When ready, run the following command in a powershell and you are good to go!
```
pnpm run start
```
