# Use Case Diagram

> Actors and use cases, verified against the API Gateway `access-policy.ts` role matrix
> and service controllers. Roles: ADMIN, STUDENT, LECTURER (+ unauthenticated Guest).
> Generated 2026-06-02.

Actor generalization: **Guest** ⟶ **Student** ⟶ **Instructor** (each inherits the
previous actor's use cases). **Admin** is a separate privileged actor.

```mermaid
flowchart LR
    Guest(["User / Guest"])
    Student(["Student"])
    Instructor(["Instructor (Lecturer)"])
    Admin(["Admin"])

    Student -.->|inherits| Guest
    Instructor -.->|inherits| Student

    subgraph Browse["Public / Browse"]
        UC_register(["Register / Login / Google OAuth"])
        UC_forgot(["Forgot password (OTP)"])
        UC_browse(["Browse & search courses"])
        UC_viewcourse(["View course detail"])
        UC_trending(["View trending feed"])
        UC_roadmap(["View roadmaps"])
        UC_instrstats(["View instructor stats"])
    end

    subgraph Learn["Learning (Student)"]
        UC_cart(["Manage cart / wishlist"])
        UC_checkout(["Checkout & pay"])
        UC_pay(["Process payment (PayOS)"])
        UC_enroll(["Enroll in course"])
        UC_learn(["Learn lessons / track progress"])
        UC_quiz(["Take quiz / submit attempt"])
        UC_feedback(["Rate & review course"])
        UC_react(["React to feedback"])
        UC_discuss(["Post / upvote discussion"])
        UC_feedint(["Like / save / comment feed"])
        UC_follow(["Follow instructor"])
        UC_report(["Report content"])
        UC_upgrade(["Request lecturer upgrade"])
        UC_notif(["View notifications"])
    end

    subgraph Teach["Teaching (Instructor)"]
        UC_course(["Create / edit course"])
        UC_submit(["Submit course for review"])
        UC_lesson(["Manage lessons / activities"])
        UC_makequiz(["Create quiz (manual / AI)"])
        UC_video(["Upload video (Bunny)"])
        UC_mascot(["Manage mascot / edit projects"])
        UC_feedpost(["Publish highlight feed"])
        UC_best(["Mark best answer"])
        UC_roadmapmgmt(["Manage roadmaps"])
        UC_analytics(["View course / feed stats"])
        UC_revenue(["View revenue dashboard"])
    end

    subgraph Govern["Administration (Admin)"]
        UC_review(["Review course (approve / reject)"])
        UC_publish(["Publish course"])
        UC_ban(["Ban / delete course"])
        UC_reports(["Review reports"])
        UC_users(["Manage users / reset"])
        UC_reviewupgrade(["Review lecturer requests"])
        UC_modfeedback(["Moderate feedback"])
        UC_audit(["View audit logs"])
        UC_issuetoken(["Issue admin token"])
    end

    Guest --> UC_register
    Guest --> UC_forgot
    Guest --> UC_browse
    Guest --> UC_viewcourse
    Guest --> UC_trending
    Guest --> UC_roadmap
    Guest --> UC_instrstats

    Student --> UC_cart
    Student --> UC_checkout
    Student --> UC_enroll
    Student --> UC_learn
    Student --> UC_quiz
    Student --> UC_feedback
    Student --> UC_react
    Student --> UC_discuss
    Student --> UC_feedint
    Student --> UC_follow
    Student --> UC_report
    Student --> UC_upgrade
    Student --> UC_notif

    Instructor --> UC_course
    Instructor --> UC_submit
    Instructor --> UC_lesson
    Instructor --> UC_makequiz
    Instructor --> UC_video
    Instructor --> UC_mascot
    Instructor --> UC_feedpost
    Instructor --> UC_best
    Instructor --> UC_roadmapmgmt
    Instructor --> UC_analytics
    Instructor --> UC_revenue

    Admin --> UC_review
    Admin --> UC_publish
    Admin --> UC_ban
    Admin --> UC_reports
    Admin --> UC_users
    Admin --> UC_reviewupgrade
    Admin --> UC_modfeedback
    Admin --> UC_audit
    Admin --> UC_issuetoken
    Admin --> UC_lesson
    Admin --> UC_course

    UC_checkout -.->|include| UC_pay
    UC_pay -.->|include| UC_enroll
    UC_makequiz -.->|extend| UC_video
    UC_upgrade -.->|extend| UC_reviewupgrade
```

## Actor capability summary

| Actor | Role | Representative capabilities |
|---|---|---|
| Guest | unauthenticated | register/login, browse & search courses, view course detail, trending feed, roadmaps, instructor stats |
| Student | STUDENT | + cart/wishlist, checkout & pay, enroll, learn & track progress, take quizzes, rate/react, discussions, feed interactions, follow instructors, report content, request lecturer upgrade, notifications |
| Instructor | LECTURER | + create/edit/submit courses, manage lessons & activities, create quizzes (incl. AI), upload videos, manage mascot/edit projects, publish highlight feed, mark best answer, manage roadmaps, view stats & revenue |
| Admin | ADMIN | review/approve/reject/publish/ban courses, review reports, manage users & reset, review lecturer requests, moderate feedback, view audit logs, issue admin token, plus course/lesson CRUD |

## Relationships

- `Checkout & pay` «include» `Process payment (PayOS)` «include» `Enroll in course`
  (enrollment is granted after the PayOS webhook confirms payment).
- `Create quiz (manual / AI)` «extend» `Upload video` (AI quiz generation uses the
  lesson video's SRT transcript).
- `Request lecturer upgrade` «extend» `Review lecturer requests` (admin acts on the request).
