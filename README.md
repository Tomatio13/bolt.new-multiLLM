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
        "model": "qwen2.5-coder-128k",
        "capt": "qwen2.5-coder"
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

**Tips: Important Points to Consider When Using Ollama**

The system prompt for bolt.new consists of more than 3000 tokens. Therefore, when choosing a model, you need to select an LLM that supports Long-Context. Also, since the default value for Ollama's context window is 2048, you should modify num_ctx for proper use.

Example: Changing num_ctx for qwen2.5-coder:7b

1. Create a Modelfile:
```text
FROM qwen2.5-coder:latest
parameter num_ctx 128000
```
2. Create a custom model on Ollama:
```bash
ollama create qwen2.5-coder-128k -f Modelfile
```