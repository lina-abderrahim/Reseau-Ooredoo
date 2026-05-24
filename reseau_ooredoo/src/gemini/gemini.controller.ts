import { Controller, Post, Body } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Controller('chat')
export class GeminiController {
  constructor(private readonly chatService: GeminiService) {}

  // ✅ Route /chat/ask
  @Post('ask')
  async handleChat(@Body('prompt') prompt: string) {
    const answer = await this.chatService.getChatResponse(prompt);
    return { answer };
  }
}