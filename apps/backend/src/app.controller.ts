import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      name: 'BrewLite API',
      version: '1.0.0',
      description: 'Cashless Coffee Ordering System REST API',
      status: 'online',
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'brewlite-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
