import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, streamTextOpenAI, streamTextOllama, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import llms from '~/llms.json'; 

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  let { messages, selectedModel } = await request.json<{ messages: Messages, selectedModel: string }>();
  console.log("selectedModel", selectedModel);

  // Find the provider for the selectedModel
  const modelInfo = llms.find((model) => model.model === selectedModel);
  if (!modelInfo) {
    throw new Response("Model not found", { status: 404 });
  }
  const { provider } = modelInfo;
  console.log("provider", provider);

  const stream = new SwitchableStream();

  try {
    const options: StreamingOptions = {
      onFinish: async ({ text: content, finishReason }) => {
        if (finishReason !== 'length') {
          return stream.close();
        }

        if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
          throw Error('Cannot continue message: Maximum segments reached');
        }

        const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;

        console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);

        messages.push({ role: 'assistant', content });
        messages.push({ role: 'user', content: CONTINUE_PROMPT });
        console.log("selectedModel", selectedModel);
        const result = 
          provider === 'anthropic'
            ? await streamText(messages, context.cloudflare.env as Env, options)
            : provider === 'openai'
            ? await streamTextOpenAI(messages, context.cloudflare.env as Env, selectedModel, options)
            : provider === 'ollama'
            ? await streamTextOllama(messages, context.cloudflare.env as Env, selectedModel,options)
            : null;
        return stream.switchSource(result.toAIStream());
      },
    };

    const result =
      provider === 'anthropic'
          ? await streamText(messages, context.cloudflare.env as Env, options)
          : provider === 'openai'
          ? await streamTextOpenAI(messages, context.cloudflare.env as Env, selectedModel, options)
          : provider === 'ollama'
          ? await streamTextOllama(messages, context.cloudflare.env as Env, selectedModel, options)
          : null;

    stream.switchSource(result.toAIStream());

    return new Response(stream.readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Unhandled error:', error);

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}