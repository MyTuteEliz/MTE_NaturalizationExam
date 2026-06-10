/*
====================================================
FILE: modules.js

PURPOSE:
ALL lesson content lives here

YOU WILL EDIT THIS CONSTANTLY

RULE:
Do NOT change structure
====================================================
*/

export const modules = [
  {
    moduleId: "interview_commands",
    title: "Interview Commands",
    lessons: [
      {
        lessonId: "basic",
        title: "Basic Commands",
        items: [
          {
            type: "flashcard",
            english: "Please be seated.",
            russian: "Пожалуйста, садитесь.",
            audio: "audio/seated.mp3"
          },
          {
            type: "flashcard",
            english: "Raise your right hand.",
            russian: "Поднимите правую руку.",
            image: "images/hand.jpg",
            audio: "audio/hand.mp3"
          }
        ]
      }
    ]
  }
];
