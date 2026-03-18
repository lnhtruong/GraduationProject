import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { Video } from './video.model';
import { MascotImage } from './images.model';

@Module({
    imports: [
        SequelizeModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const dbConfig = configService.get('database');
                return {
                    ...dbConfig,
                    models: [Video, MascotImage],
                    autoLoadModels: true,
                    synchronize: false,
                };
            },
            inject: [ConfigService],
        }),
    ],
})
export class DatabaseModule { }


