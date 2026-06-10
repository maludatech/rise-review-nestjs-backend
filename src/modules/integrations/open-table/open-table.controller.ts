import { Post, UseGuards } from "@nestjs/common";
import {PlanGuard} from "../../../common/guards/plan.guard";
import {RequirePlan} from "../../../common/decorators/require-plan.decorator";


@Post('reservations')
@UseGuards(JwtAuthGuard, PlanGuard)
@RequirePlan('growth')
