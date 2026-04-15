import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Feedback } from './feedback.model';
import { User } from 'src/users/user.model';

export enum FeedbackReactionType {
  HELPFUL = 'help_ful',
  DISLIKE = 'dislike',
}

@Table({
  tableName: 'feedback_reactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class FeedbackReaction extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Feedback)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'feedback_id',
  })
  declare feedbackId: number;

  @BelongsTo(() => Feedback)
  declare feedback: Feedback;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id',
  })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.ENUM(...Object.values(FeedbackReactionType)),
    allowNull: false,
    field: 'reaction_type',
  })
  declare reactionType: FeedbackReactionType;
}
