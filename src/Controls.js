export const trunkMaps = [
    {
        id : 'bark',
        label : 'bark',
        map : 'bark-a',
        img : './assets/bark-a.jpg',
    },
    {
        id : 'elm',
        label : 'elm',
        map : 'elm',
        img : './assets/elm.png',
    },
    {
        id : 'trunk-a',
        label : 'trunk-a',
        map : 'trunk-a',
        img : './assets/trunk-a.png',
    },
    {
        id : 'bark-b',
        label : 'bark-b',
        map : 'bark-b',
        img : './assets/bark-b.jpg',
    },
];

export const leafMaps = [
    {
        id : 'leafBuilder',
        label : 'leaf builder',
        map : 'leafCanvas',
        img : './assets/leaf-a.png',
    },
    {
        id : 'leaf-a',
        label : 'leaf A',
        map : 'leave',
        img : './assets/leaf-a.png',
    },
    {
        id : 'leaf-b',
        label : 'leaf B',
        map : 'leave-b',
        img : './assets/leave.png',
    },
    {
        id : 'pine-a',
        label : 'pine A',
        map : 'pine-a',
        img : './assets/pine-a.png',
    },
];

export const attractorsControls = [
    {
        id : 'attractorPercent',
        type : 'range',
        min : 0,
        max : 1,
    },
];
export const treeControls = [
    {
        id : 'minStepFromRoot',
        type : 'range',
        min : 2,
        max : 150,
    },
    {
        id : 'minDistance',
        type : 'range',
        min : 2,
        max : 300,
    },
    {
        id : 'searchDistance',
        type : 'range',
        min : 10,
        max : 400,
    },
    {
        id : 'branchMinimumAttractors',
        type : 'range',
        min : 1,
        max : 6,
    },
    {
        id : 'branchDirectionFreedom',
        type : 'range',
        min : 0.01,
        max : 1,
    },
    {
        id : 'branchLength',
        type : 'range',
        min : 0.5,
        max : 20,
    },
    {
        id : 'branchWidth',
        type : 'range',
        min : 0.1,
        max : 40,
    },
    {
        id : 'branchLeaveCount',
        type : 'range',
        min : 1,
        max : 50,
    },
    {
        id : 'branchLeaveScale',
        type : 'range',
        min : 0.1,
        max : 4,
    },
    {
        id : 'pruneAge',
        type : 'range',
        min : 2,
        max : 100,
    },
    {
        id : 'gravity',
        type : 'range',
        min : 0,
        max : 3,
    },
    {
        id : 'barkRoughness',
        type : 'range',
        min : 0,
        max : 1,
    },
    
];