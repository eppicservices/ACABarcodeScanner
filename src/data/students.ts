// Example student data for testing
// In production, this would come from your database/API

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  homeroom: string;
}

export const students: Record<string, Student> = {
  // Test barcodes - type these or scan them
  '1001': {
    id: '1001',
    firstName: 'Emma',
    lastName: 'Johnson',
    grade: '5th',
    homeroom: 'Mrs. Smith',
  },
  '1002': {
    id: '1002',
    firstName: 'Liam',
    lastName: 'Williams',
    grade: '3rd',
    homeroom: 'Mr. Davis',
  },
  '1003': {
    id: '1003',
    firstName: 'Olivia',
    lastName: 'Brown',
    grade: '7th',
    homeroom: 'Mrs. Garcia',
  },
  '1004': {
    id: '1004',
    firstName: 'Noah',
    lastName: 'Miller',
    grade: '2nd',
    homeroom: 'Ms. Anderson',
  },
  '1005': {
    id: '1005',
    firstName: 'Ava',
    lastName: 'Davis',
    grade: '6th',
    homeroom: 'Mr. Thompson',
  },
  '1006': {
    id: '1006',
    firstName: 'Ethan',
    lastName: 'Martinez',
    grade: '4th',
    homeroom: 'Mrs. Wilson',
  },
  '1007': {
    id: '1007',
    firstName: 'Sophia',
    lastName: 'Taylor',
    grade: '8th',
    homeroom: 'Mr. Moore',
  },
  '1008': {
    id: '1008',
    firstName: 'Mason',
    lastName: 'Anderson',
    grade: '1st',
    homeroom: 'Mrs. Jackson',
  },
  '1009': {
    id: '1009',
    firstName: 'Isabella',
    lastName: 'Thomas',
    grade: 'K',
    homeroom: 'Ms. White',
  },
  '1010': {
    id: '1010',
    firstName: 'James',
    lastName: 'Harris',
    grade: '5th',
    homeroom: 'Mrs. Smith',
  },
  // Additional test IDs with different formats
  'ACA2024001': {
    id: 'ACA2024001',
    firstName: 'Charlotte',
    lastName: 'Robinson',
    grade: '6th',
    homeroom: 'Mr. Thompson',
  },
  'ACA2024002': {
    id: 'ACA2024002',
    firstName: 'Benjamin',
    lastName: 'Clark',
    grade: '4th',
    homeroom: 'Mrs. Wilson',
  },
  'ACA2024003': {
    id: 'ACA2024003',
    firstName: 'Mia',
    lastName: 'Lewis',
    grade: '3rd',
    homeroom: 'Mr. Davis',
  },
};
