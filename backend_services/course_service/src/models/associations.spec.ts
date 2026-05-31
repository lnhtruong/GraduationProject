import { Sequelize } from 'sequelize-typescript';

import { User } from '../users/user.model';
import { Course } from './course.model';
import { Enroll } from './enroll.model';
import { Feedback } from './feedback.model';
import { FeedbackReaction } from './feedback-reaction.model';
import { HighlightFeed } from './highlight-feed.model';
import { MascotImage } from './images.model';
import { LessonActivity } from './lesson-activity.model';
import { Lesson } from './lesson.model';
import { QuizOption } from './quiz-option.model';
import { QuizQuestion } from './quiz-question.model';
import { Quiz } from './quiz.model';
import { Video } from './video.model';

describe('Sequelize associations for course eager-loads', () => {
  beforeAll(() => {
    const sequelize = new Sequelize({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'noop',
      password: 'noop',
      database: 'noop',
      logging: false,
    });
    sequelize.addModels([
      MascotImage,
      User,
      Video,
      Course,
      Lesson,
      LessonActivity,
      Quiz,
      QuizQuestion,
      QuizOption,
      Feedback,
      FeedbackReaction,
      Enroll,
      HighlightFeed,
    ]);
  });

  it('Course has Lesson and Video associations for detail views', () => {
    expect(Course.associations.lessons).toBeDefined();
    expect((Course.associations.lessons as any).target).toBe(Lesson);
    expect(Course.associations.lessons.associationType).toBe('HasMany');
    expect(Course.associations.video).toBeDefined();
    expect((Course.associations.video as any).target).toBe(Video);
  });

  it('Course has public-list and cart associations', () => {
    expect(Course.associations.instructor).toBeDefined();
    expect((Course.associations.instructor as any).target).toBe(User);
    expect(Course.associations.feedbacks).toBeDefined();
    expect((Course.associations.feedbacks as any).target).toBe(Feedback);
    expect(Course.associations.enrolls).toBeDefined();
    expect((Course.associations.enrolls as any).target).toBe(Enroll);
    expect(Course.associations.highlightFeeds).toBeDefined();
    expect((Course.associations.highlightFeeds as any).target).toBe(HighlightFeed);
  });

  it('Lesson has LessonActivity and Video associations', () => {
    expect(Lesson.associations.lessonActivities).toBeDefined();
    expect((Lesson.associations.lessonActivities as any).target).toBe(LessonActivity);
    expect(Lesson.associations.lessonActivities.associationType).toBe('HasMany');
    expect(Lesson.associations.video).toBeDefined();
    expect((Lesson.associations.video as any).target).toBe(Video);
  });

  it('Quiz eager-load chain reaches options', () => {
    expect(LessonActivity.associations.quizzes).toBeDefined();
    expect((LessonActivity.associations.quizzes as any).target).toBe(Quiz);
    expect(Quiz.associations.questions).toBeDefined();
    expect((Quiz.associations.questions as any).target).toBe(QuizQuestion);
    expect(QuizQuestion.associations.options).toBeDefined();
    expect((QuizQuestion.associations.options as any).target).toBe(QuizOption);
  });
});
