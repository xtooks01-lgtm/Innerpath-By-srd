import React from 'react';
import { Badge } from './types';

export const ICONS = {
  Check: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 256 256" className={className}><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path></svg>
  ),
  X: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 256 256" className={className}><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>
  ),
  Clock: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="16" viewBox="0 0 256 256" className={className}><circle cx="128" cy="128" r="96" fill="none" /><polyline points="128 72 128 128 184 128" fill="none" /></svg>
  ),
  Star: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 256 256" className={className}><path d="M234.29,114.85l-45,38.83L203,212.83a16,16,0,0,1-23.7,17.21L128,198.88l-51.3,31.16A16,16,0,0,1,53,212.83l13.71-59.15-45-38.83a16,16,0,0,1,9-27.78l60.25-5.11,23.51-56.09a16,16,0,0,1,29.1,0l23.51,56.09,60.25,5.11a16,16,0,0,1,9,27.78ZM128,181.12a8.06,8.06,0,0,1,4,1.1l51.3,31.16-13.71-59.15a8,8,0,0,1,2.58-7.94l45-38.83-60.25-5.11a8,8,0,0,1-6.79-4.94L128,41.32,106.07,96.31a8,8,0,0,1-6.79,4.94L39,106.36l45,38.83a8,8,0,0,1,2.58,7.94L72.9,212.28l51.1-31.06A8.06,8.06,0,0,1,128,181.12Z"></path></svg>
  ),
  Mic: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 256 256" className={className}><path d="M128,176a48.05,48.05,0,0,0,48-48V64a48,48,0,0,0-96,0v64A48.05,48.05,0,0,0,128,176ZM96,64a32,32,0,0,1,64,0v64a32,32,0,0,1-64,0Zm112,64a8,8,0,0,1-16,0,64,64,0,0,0-128,0,8,8,0,0,1-16,0,80.09,80.09,0,0,1,72-79.6V32a8,8,0,0,1,16,0V48.4A80.09,80.09,0,0,1,208,128Z"></path></svg>
  ),
  Calendar: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 256 256" className={className}><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V80H208V208Zm0-144H48V48H72v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24Z"></path></svg>
  ),
  Award: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 256 256" className={className}><path d="M229.62,118.42A72,72,0,1,0,128,158.4V240a8,8,0,0,0,12.55,6.58l41.45-29,41.45,29A8,8,0,0,0,236,240V158.4a71.6,71.6,0,0,0-6.38-39.98ZM128,144a56,56,0,1,1,56-56A56.06,56.06,0,0,1,128,144Zm92,86.22-34.55-24.19a8,8,0,0,0-9.1,0l-34.55,24.19V159a72.13,72.13,0,0,0,78.2,0Z"></path></svg>
  ),
  Volume2: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 256 256" className={className}><path d="M160,32V224a8,8,0,0,1-12.91,6.31L77.25,176H32a16,16,0,0,1-16-16V96A16,16,0,0,1,32,80H77.25l69.84-54.31A8,8,0,0,1,160,32ZM32,96v64H80a8,8,0,0,1,4.91,1.69L144,207.71V48.29L84.91,94.31A8,8,0,0,1,80,96ZM192,128a32,32,0,0,1-9.37,22.63,8,8,0,0,1-11.32-11.32,16,16,0,0,0,0-22.62,8,8,0,0,1,11.32-11.32A32,32,0,0,1,192,128Zm32,0a64,64,0,0,1-18.75,45.25,8,8,0,0,1-11.32-11.32,48,48,0,0,0,0-67.86,8,8,0,0,1,11.32-11.32A64,64,0,0,1,224,128Z"></path></svg>
  ),
  VolumeX: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 256 256" className={className}><path d="M160,32V224a8,8,0,0,1-12.91,6.31L77.25,176H32a16,16,0,0,1-16-16V96A16,16,0,0,1,32,80H77.25l69.84-54.31A8,8,0,0,1,160,32ZM32,96v64H80a8,8,0,0,1,4.91,1.69L144,207.71V48.29L84.91,94.31A8,8,0,0,1,80,96Zm112,32,48-48,48,48a8,8,0,0,1-11.32,11.32L128,128l11.32,11.32a8,8,0,0,1,11.32,11.32L128,152l11.32,11.32a8,8,0,1,1-11.32,11.32L128,128Z"></path></svg>
  ),
  ChartBar: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 256 256" className={className}><path d="M224,200h-8V40a8,8,0,0,0-8-8H160a8,8,0,0,0-8,8V200h-24V88a8,8,0,0,0-8-8H72a8,8,0,0,0-8,8V200H40a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM168,48h32V200H168ZM80,96h32V200H80Z"></path></svg>
  ),
  User: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 256 256" className={className}><path d="M128,144a64,64,0,1,0-64-64A64.07,64.07,0,0,0,128,144Zm0-112a48,48,0,1,1-48,48A48.05,48.05,0,0,1,128,32Zm0,120c-44.11,0-80,20.15-80,45a8,8,0,0,0,16,0c0-11.58,28.71-29,64-29s64,17.42,64,29a8,8,0,0,0,16,0C208,172.15,172.11,152,128,152Z"></path></svg>
  ),
  CaretRight: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 256 256" className={className}><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path></svg>
  ),
  Target: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="16" viewBox="0 0 256 256" className={className}><circle cx="128" cy="128" r="96" /><circle cx="128" cy="128" r="64" /><circle cx="128" cy="128" r="32" /></svg>
  ),
  Shield: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="16" viewBox="0 0 256 256" className={className}><path d="M208,48,128,32,48,48V128c0,60,80,96,80,96s80-36,80-96Z" /></svg>
  ),
  Infinity: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="16" viewBox="0 0 256 256" className={className}><path d="M232,128c0,40-32,72-72,72s-64-72-96-72-72,32-72,72S24,200,64,200s64-72,96-72,72,32,72,72" /></svg>
  ),
  Zap: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="16" viewBox="0 0 256 256" className={className}><polygon points="160 32 64 144 120 144 96 224 192 112 136 112 160 32" /></svg>
  ),
  Compass: ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="16" viewBox="0 0 256 256" className={className}><circle cx="128" cy="128" r="96" /><path d="M104,152l48-48-24,72-72,24Z" /></svg>
  )
};

export const BADGES: Badge[] = [
  { id: 'b1', name: 'First Step', icon: 'Target', description: 'Started your first goal.', requirement: 'Complete 1 goal' },
  { id: 'b2', name: 'Focus Master', icon: 'Compass', description: 'Completed a task without pauses.', requirement: '3 tasks focused' },
  { id: 'b3', name: 'Early Bird', icon: 'Clock', description: 'Completed a task before 8 AM.', requirement: 'Morning productivity' },
  { id: 'b4', name: 'Consistency King', icon: 'Infinity', description: 'Maintained a 7-day streak.', requirement: '7-day streak' },
  { id: 'b5', name: 'XP Hunter', icon: 'Zap', description: 'Reached 500 total XP.', requirement: '500 XP' },
  { id: 'b6', name: 'Time Bender', icon: 'Clock', description: 'Finished a long task with time to spare.', requirement: 'Effort & Speed' },
  { id: 'b7', name: 'Pathfinder', icon: 'Compass', description: 'Explored all categories.', requirement: 'Variety of goals' },
  { id: 'b8', name: 'Resilient', icon: 'Shield', description: 'Recovered from a missed task.', requirement: 'Recovery mode use' },
  { id: 'b9', name: 'Architect', icon: 'Target', description: 'Built a full-day timetable.', requirement: 'Full schedule' },
  { id: 'b10', name: 'Grand Master', icon: 'Star', description: 'Reached level 10.', requirement: 'Level 10 reached' }
];
