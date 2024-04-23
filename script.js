function validateCourseInfo(courseInfo, assignmentGroup) {
    if (courseInfo.id !== assignmentGroup.course_id) {
      throw new Error("Invalid data: Assignment group does not belong to the course.");
    }
  }
  
  function calculateWeightedScore(submission, assignment) {
    try {
      const score = submission.score / assignment.points_possible;
      if (submission.submitted_at && new Date(submission.submitted_at) > new Date(assignment.due_at)) {
        return score * 0.9; // Deduct 10% for late submissions
      }
      return score * (assignment.group_weight || 1); // Default weight to 1 if not provided
    } catch (error) {
      if (error.name === "TypeError") {
        console.error(`Error processing submission: Invalid data type.`);
      } else {
        console.error(`Error processing submission: ${error.message}`);
      }
      return 0; // Return 0 for errors to avoid affecting calculations
    }
  }
  
  function processLearner(learnerId, submissions, assignments) {
    let totalWeight = 0;
    let totalScore = 0;
    const assignmentScores = {};
    for (const submission of submissions) {
      const assignmentId = submission.assignment_id;
      if (!assignments[assignmentId]) continue; // Skip assignments not found
      const assignment = assignments[assignmentId];
      const dueDate = new Date(assignment.due_at);
      if (dueDate > new Date()) continue; 
  
      try {
        const score = calculateWeightedScore(submission.submission, assignment);
        totalWeight += score;
        totalScore += score;
        assignmentScores[assignmentId] = score;
      } catch (error) {
        console.error(`Error processing submission for learner ${learnerId} and assignment ${assignmentId}: ${error.message}`);
      }
    }
    return {
      id: learnerId,
      avg: totalWeight ? totalScore / totalWeight : 0,
      ...assignmentScores,
    };
  }
  
  function getLearnerData(courseInfo, assignmentGroup, learnerSubmissions) {
    validateCourseInfo(courseInfo, assignmentGroup);
    const assignments = assignmentGroup.assignments.reduce((acc, assignment) => {
      acc[assignment.id] = assignment;
      return acc;
    }, {});
    const learnerData = [];
    for (const submission of learnerSubmissions) {
      const learnerId = submission.learner_id;
      const learnerSubmissionsByLearner = learnerSubmissions.filter(s => s.learner_id === learnerId);
      learnerData.push(processLearner(learnerId, learnerSubmissionsByLearner, assignments));
    }
    return learnerData;
  }
  
  // Example usage (replace with your actual data)
  const courseInfo = { id: 1, name: "Introduction to Programming" };
  const assignmentGroup = {
    id: 1,
    name: "Homework 1",
    course_id: 1,
    group_weight: 0.5,
    assignments: [
      { id: 11, name: "Problem Set 1", due_at: "2024-04-20T00:00:00", points_possible: 100 },
      { id: 12, name: "Midterm Exam", due_at: "2024-05-01T00:00:00", points_possible: 200 },
    ],
  };
  const learnerSubmissions = [
    {
      learner_id: 1,
      assignment_id: 11,
      submission: {
        submitted_at: "2024-04-15T00:00:00",
        score: 80,
      },
    },
    // ... other learner submissions
  ];
  
  const results = getLearnerData(courseInfo, assignmentGroup, learnerSubmissions);
  console.log(results);
  