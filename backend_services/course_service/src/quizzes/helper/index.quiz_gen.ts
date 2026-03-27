import { createQuiz, QuizPayload } from "./quiz.gen"

export async function generateQuizPayload(srtRaw: string): Promise<QuizPayload> {
  return createQuiz(srtRaw, {
    lessonActivityId: 1,
    name: "Quiz 1",
    shuffleQuestion: false,
    shuffleOption: false,
    passingScore: 5,
    timeLimitMinutes: 10,
  }, { TOPIC: "DSA", PCT_MCQ: 60, PCT_TRUE_FALSE: 20, PCT_SHORT_TEXT: 20 })
}


async function test() {
  const srtRaw = `
  1
00:00:00,000 --> 00:00:40,219
Have you ever tried managing a project across emails, Spreadsheets, and chat threads? It gets messy fast. That's where JIRA comes in. It's an AI -powered project management tool that helps you plan, Organize, And automate your work all in one place. Hi, I'm Kevin, and today I teamed up with JIRA to show you how any team can use It. Not just developers. You'll see how to get started, explore the key features, And use AI to make project management faster and also a whole lot easier. Let's dive in. To get started, head to the link right down below.

2
00:02:33,659 --> 00:03:24,680
I'll name my project this. Once you've chosen a name down at the bottom, click on get started. Now, JIRA asks what type of work you want to track in this space. These are the building Blocks of your project. You have things like tasks, Requests, Campaigns. Now, for this, I'm going to start with task to keep things simple, But you can always add more later on. Down below, let's click on next. This brings us to the last step in the setup, choosing how you want to track work. By default, JIRA gives you three simple stages. We have to do in progress and done. I think that's perfect for getting started, so I'll leave it just like this. Of course, You can always add or remove stages later. Down at the bottom, let's now click on finish and JIRA will create your workspace. And here we are. You're making great progress. This is our new space for the cookie box launch campaign.

3
00:03:39,300 --> 00:04:15,460
Within this view, this is where we'll track everything from start to finish. Across the top, you'll see different views. Like here, we have the list view, a board, a calendar, and also a timeline. Right now, we're in the list view, which works a lot like a spreadsheet. It's perfect for adding and also organizing tasks. Over on the right hand side, you'll notice the quick start guide. This gives you tips for getting up and running fast. It's really helpful if you're brand new to JIRA, but for now, Let's close it out. I'll click on this icon. That way, we can focus on building out our project. Down in the bottom right -hand corner, you can always open it again if you want to review

4
00:04:21,220 --> 00:05:48,620
To add a task right over here, let's click on Create. And then we could type in the first task. I'll type in Design Packaging. We want this packaging to look good. Over on the right hand side, we could click on Create. Or, what I like doing is simply Press the Enter key on your keyboard, and that adds the first task. Let's add a few more. For the second one, we need to write a social media post, then I'll press Enter. And lastly, we also need to review Add Copy with Legal. This one's extremely important. Then, here again, I'll press Enter. And these will be the main things our marketing and design teams need to get started. Of course, you could always come in and add more tasks later. But keeping it simple like this makes it easy to focus on what really matters. For each of These different tasks that we added, you could also set the details related to that task. As an example, you could set a due date. For the Design Packaging, We need that pretty urgently. So, let's set that for next week. Over here, I could also set dates for the other items as well. I'll set a few different dates. To the right of that, we could also set the Priority. Design Packaging, like I said, is very important. So, let's click on that. And let's set it to Highest Priority. If we scroll over to the right, you'll see that we Also have additional fields or columns in. We could enter in different values. If you don't see a column that you need over on the right -hand side, you can also Click on this plus icon and you can add additional fields to this table. And in fact, you Could even add a completely new field down here at the bottom. Let's scroll back over to the left.

5
00:09:30,899 --> 00:10:17,059
But one of the best things about JIRA is that you can switch between different views depending on How your team likes to work. Let's now shift to the board view. Right up on top, I'll Click on board. This gives us a Kanban style board where we can move the different tasks through all the different Stages. There's that design packaging task, and it's high priority. Now, I've started putting in a description, and I also thought about some of the sub tasks. So I personally think that qualifies as in progress. So I could simply press and hold on this task, and here I could drag it over to In progress, and look at that, starting to get things done. Up on top, we can also shift Into the calendar view. Now, way we can see all the different upcoming tasks by date. Right over here, we can visualize all of that on a calendar.

6
00:19:00,200 --> 00:19:33,759
And that's a quick look at how you can use JIRA for project management. What's great about JIRA is that it brings all your teams together. Marketing, operations, design, even legal, all in one place. Now many other tools handle just one side of project management. But JIRA scales across the entire organization and it even adds built in AI to keep everything connected. Again, you could try JIRA for free and the link is right down below. And stay tuned. Let's see how that cookie box launch campaign turns out.
  `
  const quizPayload = await generateQuizPayload(srtRaw)
  console.log(JSON.stringify(quizPayload, null, 2))
}

test()
  