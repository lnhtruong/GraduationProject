import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { IsAfterConstraint } from 'src/validators/is-ater.validator';
import { MascotOverlay } from './mascot_overlay.model';
import { MascotOverlayController } from './mascot_overlay.controller';
import { MascotOverlayService } from './mascot_overlay.service';

@Module({
    imports: [SequelizeModule.forFeature([MascotOverlay])],
    controllers: [MascotOverlayController],
    providers: [MascotOverlayService, IsAfterConstraint],
    exports: [MascotOverlayService],
})
export class MascotOverlayModule { }


