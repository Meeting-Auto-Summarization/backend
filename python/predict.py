import torch
from transformers import PreTrainedTokenizerFast
from transformers import BartForConditionalGeneration
import sys
import json

if __name__ == '__main__':
    tokenizer = PreTrainedTokenizerFast.from_pretrained('gogamza/kobart-summarization')
    model = BartForConditionalGeneration.from_pretrained('gogamza/kobart-summarization')

    text = json.loads(sys.argv[1])

    summaryList = []

    for i in range(len(text)):
        summaryList.append([])
        for j in range(len(text[i])):
            raw_input_ids = tokenizer.encode(text[i][j])
            input_ids = [tokenizer.bos_token_id] + raw_input_ids + [tokenizer.eos_token_id]

            summary_ids = model.generate(torch.tensor([input_ids]))
            summaryList[i].append(tokenizer.decode(summary_ids.squeeze().tolist(), skip_special_tokens=True))

    print(summaryList)
