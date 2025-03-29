import os
import json
import openai
from transformers import pipeline
# from google.colab import userdata
from prompts import prompts

def load_model(model_name):
    """Load a Hugging Face text generation pipeline."""
    print(f"Loading model: {model_name}")
    return pipeline("text-generation", model=model_name)

def run_huggingface_prompt(model_pipeline, prompt, max_tokens=500):
    """Generate text using a Hugging Face model pipeline with assistant context."""
    context_prompt = f"This is a conversation between a user and a helpful AI assistant. User: {prompt}\nAssistant:"
    result = model_pipeline(context_prompt, max_length=max_tokens)
    return result[0]["generated_text"].replace(context_prompt, "").strip()

def run_openai_prompt(model_id, prompt, api_key, max_tokens=4096):
    """Generate text using OpenAI's API, selecting the appropriate endpoint."""
    client = openai.OpenAI(api_key=api_key)
    if model_id == "davinci-002":
        context_prompt = f"This is a conversation between a user and a helpful AI assistant. User: {prompt}\nAssistant:"
        response = client.completions.create(
            model=model_id,
            prompt=context_prompt,
            max_tokens=max_tokens
        )
        return response.choices[0].text.strip()
    elif model_id == "o3-mini-2025-01-31":
        response = client.chat.completions.create(
            model=model_id,
            messages=[
                {"role": "user", "content": prompt},
            ],
            max_completion_tokens=max_tokens * 5,
            reasoning_effort="high",
        )
        return response.choices[0].message.content.strip()
    else:
        response = client.chat.completions.create(
            model=model_id,
            messages=[
                {"role": "user", "content": prompt},
            ],
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()

def main():
    openai_api_key = os.getenv("OPENAI_API_KEY") # or userdata.get("OPENAI_API_KEY")
    if not openai_api_key:
        print("Error: OpenAI API key is required. Set the OPENAI_API_KEY environment variable or store it in Google Colab secrets.")
        return
    
    models = {
        # "GPT-1": {"type": "huggingface", "model": "openai-community/openai-gpt"},
        "GPT-3": {"type": "openai", "model": "davinci-002"},
        "GPT-3.5": {"type": "openai", "model": "gpt-3.5-turbo-0125"},
        "o3-mini": {"type": "openai", "model": "o3-mini-2025-01-31"},
    }
    
    results = []
    for prompt in prompts:
        prompt_result = {"prompt": prompt, "responses": []}
        for name, model_info in models.items():
            print(f"Running {name}...")
            if model_info["type"] == "huggingface":
                model_pipeline = load_model(model_info["model"])
                response = run_huggingface_prompt(model_pipeline, prompt)
            else:
                response = run_openai_prompt(model_info["model"], prompt, openai_api_key)
            prompt_result["responses"].append({"model": name, "response": response})
        results.append(prompt_result)
    
    with open("responses.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print("Results saved to responses.json")

if __name__ == "__main__":
    main()
