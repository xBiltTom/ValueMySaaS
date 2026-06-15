import asyncio
import g4f

async def main():
    client = g4f.client.AsyncClient()
    response = await client.chat.completions.create(
        model=g4f.models.default,
        messages=[{"role": "user", "content": "Hola, ¿cómo estás?"}],
    )
    print("Normal response:")
    print(response.choices[0].message.content)
    
    print("\nStreaming response:")
    stream = await client.chat.completions.create(
        model=g4f.models.default,
        messages=[{"role": "user", "content": "Dime un chiste corto."}],
        stream=True
    )
    async for chunk in stream:
        if chunk.choices and len(chunk.choices) > 0:
            print(chunk.choices[0].delta.content or "", end="", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
