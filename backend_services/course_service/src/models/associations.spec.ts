/**
 * Verify that the eager-load chain used by `course.service.findOne()` has all
 * required Sequelize associations declared. Loading the models into a fresh
 * Sequelize instance also smoke-tests the circular import between
 * `LessonActivity` and `Quiz` (HasMany ↔ BelongsTo).
 */
import { Sequelize } from 'sequelize-typescript';

import { Course } from './course.model';
import { Lesson } from './lesson.model';
import { LessonActivity } from './lesson-activity.model';
import { Quiz } from './quiz.model';
import { QuizQuestion } from './quiz-question.model';
import { QuizOption } from './quiz-option.model';
import { Video } from './video.model';
import { MascotImage } from './images.model';

describe('Sequelize associations for /courses/:id eager-load', () => {
  beforeAll(() => {
    // Không cần kết nối DB thật — chỉ cần Sequelize.addModels(...) chạy qua
    // để các decorator (@HasMany, @BelongsTo, ...) được thực thi và tạo
    // associations metadata. mysql2 driver có sẵn nên đỡ phải cài thêm
    // sqlite3 (cần native build).
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
      Video,
      Course,
      Lesson,
      LessonActivity,
      Quiz,
      QuizQuestion,
      QuizOption,
    ]);
  });

  it('Course có HasMany Lesson với alias "lessons"', () => {
    expect(Course.associations.lessons).toBeDefined();
    expect((Course.associations.lessons as any).target).toBe(Lesson);
    expect(Course.associations.lessons.associationType).toBe('HasMany');
  });

  it('Course có BelongsTo Video với alias "video"', () => {
    expect(Course.associations.video).toBeDefined();
    expect((Course.associations.video as any).target).toBe(Video);
  });

  it('Lesson có HasMany LessonActivity với alias "lessonActivities"', () => {
    expect(Lesson.associations.lessonActivities).toBeDefined();
    expect((Lesson.associations.lessonActivities as any).target).toBe(LessonActivity);
    expect(Lesson.associations.lessonActivities.associationType).toBe('HasMany');
  });

  it('Lesson có BelongsTo Video', () => {
    // alias mặc định = "video"
    expect(Lesson.associations.video).toBeDefined();
    expect((Lesson.associations.video as any).target).toBe(Video);
  });

  it('LessonActivity có HasMany Quiz với alias "quizzes"', () => {
    expect(LessonActivity.associations.quizzes).toBeDefined();
    expect((LessonActivity.associations.quizzes as any).target).toBe(Quiz);
    expect(LessonActivity.associations.quizzes.associationType).toBe('HasMany');
  });

  it('Quiz có HasMany QuizQuestion với alias "questions"', () => {
    expect(Quiz.associations.questions).toBeDefined();
    expect((Quiz.associations.questions as any).target).toBe(QuizQuestion);
    expect(Quiz.associations.questions.associationType).toBe('HasMany');
  });

  it('QuizQuestion có HasMany QuizOption với alias "options"', () => {
    expect(QuizQuestion.associations.options).toBeDefined();
    expect((QuizQuestion.associations.options as any).target).toBe(QuizOption);
    expect(QuizQuestion.associations.options.associationType).toBe('HasMany');
  });
});
