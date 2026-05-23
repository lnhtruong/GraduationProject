import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const stubService = {
      getPoolStatus: jest.fn().mockResolvedValue({
        total: 0,
        healthy: 0,
        workers: [],
      }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: stubService }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should describe the service and its endpoints', () => {
      const home = appController.getHome();
      expect(home).toEqual(
        expect.objectContaining({
          service: expect.any(String),
          endpoints: expect.objectContaining({
            job_status: 'GET /jobs/status/:job_id',
            pool_status: 'GET /pool/status',
          }),
        }),
      );
    });
  });
});
