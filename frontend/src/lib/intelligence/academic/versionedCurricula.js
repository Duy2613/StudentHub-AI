/**
 * StudentHub AI — Versioned University Curricula (2023–2026)
 * 
 * Implements Constitution Article 11 (Curriculum Graph) and Article 12 (Versioned Curricula):
 * Ensures students are strictly evaluated under their respective cohort's curriculum version
 * rather than applying today's updated curriculum blindly to older cohorts.
 */

export const HCMUTE_VERSIONED_CURRICULA = {
  "7480103": {
    programName: "Kỹ thuật Phần mềm (Software Engineering)",
    facultyId: "fit",
    totalCredits: 150,
    versions: {
      "2023": {
        versionId: "HCMUTE_SE_2023",
        cohort: 2023,
        effectiveYear: 2023,
        sourceDocument: "Quyết định số 1420/QĐ-ĐHSPKT ngày 15/08/2023",
        semesters: [
          {
            semesterIndex: 1,
            recommendedCredits: 17,
            courses: ["MATH141701", "MATH132401", "PROG130103", "PHYS130101", "LLCT120105"]
          },
          {
            semesterIndex: 2,
            recommendedCredits: 18,
            courses: ["MATH141801", "MATH132601", "OOPL230103", "DSAA230203", "LLCT120205"]
          },
          {
            semesterIndex: 3,
            recommendedCredits: 18,
            courses: ["DBMS330203", "OSYS230103", "NWKS330103", "MOBL330303"]
          },
          {
            semesterIndex: 4,
            recommendedCredits: 18,
            courses: ["SWEN330103", "WDEV330203"]
          },
          {
            semesterIndex: 5,
            recommendedCredits: 18,
            courses: ["INTR430103"]
          },
          {
            semesterIndex: 6,
            recommendedCredits: 16,
            courses: []
          },
          {
            semesterIndex: 7,
            recommendedCredits: 16,
            courses: []
          },
          {
            semesterIndex: 8,
            recommendedCredits: 10,
            courses: ["GRAP440103"]
          }
        ],
        graduationConditions: {
          minCredits: 150,
          minGpa: 2.00,
          englishLevel: "TOEIC 450",
          thesisCredit: 10
        }
      },
      "2024": {
        versionId: "HCMUTE_SE_2024",
        cohort: 2024,
        effectiveYear: 2024,
        sourceDocument: "Quyết định số 1680/QĐ-ĐHSPKT ngày 20/08/2024",
        semesters: [
          {
            semesterIndex: 1,
            recommendedCredits: 17,
            courses: ["MATH141701", "MATH132401", "PROG130103", "PHYS130101", "LLCT120105"]
          },
          {
            semesterIndex: 2,
            recommendedCredits: 18,
            courses: ["MATH141801", "MATH132601", "OOPL230103", "DSAA230203", "LLCT120205"]
          },
          {
            semesterIndex: 3,
            recommendedCredits: 18,
            courses: ["DBMS330203", "OSYS230103", "NWKS330103", "MOBL330303"]
          },
          {
            semesterIndex: 4,
            recommendedCredits: 18,
            courses: ["SWEN330103", "WDEV330203"]
          },
          {
            semesterIndex: 5,
            recommendedCredits: 18,
            courses: ["INTR430103"]
          },
          {
            semesterIndex: 6,
            recommendedCredits: 16,
            courses: []
          },
          {
            semesterIndex: 7,
            recommendedCredits: 16,
            courses: []
          },
          {
            semesterIndex: 8,
            recommendedCredits: 10,
            courses: ["GRAP440103"]
          }
        ],
        graduationConditions: {
          minCredits: 150,
          minGpa: 2.00,
          englishLevel: "TOEIC 500",
          thesisCredit: 10
        }
      },
      "2025": {
        versionId: "HCMUTE_SE_2025",
        cohort: 2025,
        effectiveYear: 2025,
        sourceDocument: "Quyết định số 1910/QĐ-ĐHSPKT ngày 18/08/2025",
        semesters: [
          {
            semesterIndex: 1,
            recommendedCredits: 17,
            courses: ["MATH141701", "MATH132401", "PROG130103", "PHYS130101", "LLCT120105"]
          },
          {
            semesterIndex: 2,
            recommendedCredits: 18,
            courses: ["MATH141801", "MATH132601", "OOPL230103", "DSAA230203", "LLCT120205"]
          },
          {
            semesterIndex: 3,
            recommendedCredits: 18,
            courses: ["DBMS330203", "OSYS230103", "NWKS330103", "MOBL330303"]
          },
          {
            semesterIndex: 4,
            recommendedCredits: 18,
            courses: ["SWEN330103", "WDEV330203"]
          },
          {
            semesterIndex: 5,
            recommendedCredits: 18,
            courses: ["INTR430103"]
          },
          {
            semesterIndex: 6,
            recommendedCredits: 16,
            courses: []
          },
          {
            semesterIndex: 7,
            recommendedCredits: 16,
            courses: []
          },
          {
            semesterIndex: 8,
            recommendedCredits: 10,
            courses: ["GRAP440103"]
          }
        ],
        graduationConditions: {
          minCredits: 150,
          minGpa: 2.00,
          englishLevel: "TOEIC 500 / B1 International",
          thesisCredit: 10
        }
      },
      "2026": {
        versionId: "HCMUTE_SE_2026",
        cohort: 2026,
        effectiveYear: 2026,
        sourceDocument: "Quyết định số 2045/QĐ-ĐHSPKT ngày 10/08/2026",
        semesters: [
          {
            semesterIndex: 1,
            recommendedCredits: 17,
            courses: ["MATH141701", "MATH132401", "PROG130103", "PHYS130101", "LLCT120105"]
          },
          {
            semesterIndex: 2,
            recommendedCredits: 18,
            courses: ["MATH141801", "MATH132601", "OOPL230103", "DSAA230203", "LLCT120205"]
          },
          {
            semesterIndex: 3,
            recommendedCredits: 18,
            courses: ["DBMS330203", "OSYS230103", "NWKS330103", "MOBL330303"]
          },
          {
            semesterIndex: 4,
            recommendedCredits: 18,
            courses: ["SWEN330103", "WDEV330203"]
          },
          {
            semesterIndex: 5,
            recommendedCredits: 18,
            courses: ["INTR430103"]
          },
          {
            semesterIndex: 6,
            recommendedCredits: 16,
            courses: []
          },
          {
            semesterIndex: 7,
            recommendedCredits: 16,
            courses: []
          },
          {
            semesterIndex: 8,
            recommendedCredits: 10,
            courses: ["GRAP440103"]
          }
        ],
        graduationConditions: {
          minCredits: 150,
          minGpa: 2.00,
          englishLevel: "TOEIC 550 / B2 International",
          thesisCredit: 10
        }
      }
    }
  }
};

/**
 * Retrieves the exact curriculum structure for a student cohort
 * @param {string} programCode - e.g. "7480103"
 * @param {number|string} cohort - e.g. 2024
 * @returns {object|null}
 */
export function getCurriculumForStudent(programCode = "7480103", cohort = 2024) {
  const program = HCMUTE_VERSIONED_CURRICULA[programCode];
  if (!program) return null;

  const version = program.versions[String(cohort)] || program.versions["2024"];
  return {
    programCode,
    programName: program.programName,
    facultyId: program.facultyId,
    totalCredits: program.totalCredits,
    version
  };
}
