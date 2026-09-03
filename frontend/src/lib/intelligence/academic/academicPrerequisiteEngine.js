/**
 * StudentHub AI — Canonical Academic Prerequisite & Course Graph Engine V1
 * 
 * Manages the course prerequisite DAG, course availability, cycle detection,
 * and downstream unlock cascades for HCMUTE curricula.
 */

import { HCMUTE_UNIVERSITY_PROFILE } from "./hcmuteKnowledgeGraph.js";

export class AcademicPrerequisiteEngine {
  /**
   * Retrieves all courses in the institutional catalog
   * @returns {Array<object>}
   */
  static getAllCourses() {
    return (HCMUTE_UNIVERSITY_PROFILE.courses || []).map(c => Object.freeze({ ...c }));
  }

  /**
   * Looks up a course by its unique code
   * @param {string} courseCode 
   * @returns {object|null}
   */
  static getCourseByCode(courseCode) {
    if (!courseCode) return null;
    const cleanCode = String(courseCode).trim().toUpperCase();
    const course = (HCMUTE_UNIVERSITY_PROFILE.courses || []).find(
      c => c.code.toUpperCase() === cleanCode
    );
    return course ? Object.freeze({ ...course }) : null;
  }

  /**
   * Validates whether all prerequisites for a course are satisfied
   * @param {string} courseCode 
   * @param {Array<string>} completedCourseCodes 
   * @returns {{ isSatisfied: boolean, missingPrerequisites: string[], prerequisites: string[] }}
   */
  static validatePrerequisites(courseCode, completedCourseCodes = []) {
    const course = this.getCourseByCode(courseCode);
    if (!course) {
      return {
        isSatisfied: false,
        missingPrerequisites: [courseCode],
        prerequisites: []
      };
    }

    const completedSet = new Set(
      (completedCourseCodes || []).map(c => String(c).trim().toUpperCase())
    );

    const prerequisites = (course.prerequisites || []).map(p => String(p).trim().toUpperCase());
    const missingPrerequisites = prerequisites.filter(prereq => !completedSet.has(prereq));

    return Object.freeze({
      isSatisfied: missingPrerequisites.length === 0,
      missingPrerequisites: Object.freeze(missingPrerequisites),
      prerequisites: Object.freeze(prerequisites)
    });
  }

  /**
   * Checks if a course is scheduled/available in a specific semester
   * @param {string} courseCode 
   * @param {number} semester - 1, 2, or 3 (Summer)
   * @returns {boolean}
   */
  static isAvailableInSemester(courseCode, semester = 1) {
    const course = this.getCourseByCode(courseCode);
    if (!course) return false;

    const avail = course.semesterAvailability || [1, 2];
    return avail.includes(Number(semester));
  }

  /**
   * Returns all eligible, uncompleted courses whose prerequisites are satisfied and are offered in the target term
   * @param {object} params
   * @returns {Array<object>} List of feasible courses
   */
  static getFeasibleCourses({ completedCourses = [], targetSemester = 1 }) {
    const completedSet = new Set(
      (completedCourses || []).map(c => typeof c === "string" ? c.trim().toUpperCase() : (c.courseCode || "").trim().toUpperCase())
    );

    const allCourses = this.getAllCourses();
    const feasible = [];

    for (const course of allCourses) {
      const code = course.code.toUpperCase();
      // 1. Skip if already completed
      if (completedSet.has(code)) continue;

      // 2. Check prerequisites
      const prereqCheck = this.validatePrerequisites(code, Array.from(completedSet));
      if (!prereqCheck.isSatisfied) continue;

      // 3. Check semester availability
      if (!this.isAvailableInSemester(code, targetSemester)) continue;

      const unlocks = this.getCourseDownstreamUnlocks(code);

      feasible.push(Object.freeze({
        ...course,
        unlockedDownstreamCount: unlocks.length,
        unlockedCourses: Object.freeze(unlocks)
      }));
    }

    return Object.freeze(feasible);
  }

  /**
   * Computes all courses directly or transitively unlocked by completing target course
   * @param {string} courseCode 
   * @returns {Array<string>}
   */
  static getCourseDownstreamUnlocks(courseCode) {
    const cleanCode = String(courseCode).trim().toUpperCase();
    const allCourses = this.getAllCourses();

    const directUnlocked = allCourses.filter(
      c => (c.prerequisites || []).some(p => p.toUpperCase() === cleanCode)
    );

    const unlockedSet = new Set(directUnlocked.map(c => c.code));
    const queue = [...unlockedSet];

    while (queue.length > 0) {
      const curr = queue.shift();
      const nextDependents = allCourses.filter(
        c => (c.prerequisites || []).some(p => p.toUpperCase() === curr)
      );
      for (const dep of nextDependents) {
        if (!unlockedSet.has(dep.code)) {
          unlockedSet.add(dep.code);
          queue.push(dep.code);
        }
      }
    }

    return Array.from(unlockedSet);
  }

  /**
   * Detects cycles in the institutional prerequisite graph
   * @returns {{ hasCycle: boolean, cycleNodes: string[] }}
   */
  static detectPrerequisiteCycles() {
    const allCourses = this.getAllCourses();
    const adjList = new Map();

    for (const c of allCourses) {
      adjList.set(c.code, (c.prerequisites || []).map(p => p.toUpperCase()));
    }

    const visited = new Map(); // 0 = unvisited, 1 = visiting, 2 = visited
    const cycleNodes = [];

    const dfs = (node) => {
      visited.set(node, 1);
      const neighbors = adjList.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) || visited.get(neighbor) === 0) {
          if (dfs(neighbor)) return true;
        } else if (visited.get(neighbor) === 1) {
          cycleNodes.push(node, neighbor);
          return true;
        }
      }
      visited.set(node, 2);
      return false;
    };

    for (const c of allCourses) {
      if (!visited.get(c.code)) {
        if (dfs(c.code)) {
          return { hasCycle: true, cycleNodes: Array.from(new Set(cycleNodes)) };
        }
      }
    }

    return { hasCycle: false, cycleNodes: [] };
  }
}
