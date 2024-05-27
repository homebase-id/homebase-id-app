
export type Gradient = {
    colors: string[];
    start: { x: number; y: number };
    end: { x: number; y: number };
    angle?: number;
};

export type ChatColor = {
    id: string;
    gradient?: Gradient;
    color?: string;
    isBuiltIn: boolean;
    creationTimestamp: number;
};


//TODO: Fix the gradient angles
const createGradient = (colors: string[], angle: number): Gradient => {
    const start = { x: 0.5 - 0.5 * Math.cos(angle), y: 0.5 - 0.5 * Math.sin(angle) };
    const end = { x: 0.5 + 0.5 * Math.cos(angle), y: 0.5 + 0.5 * Math.sin(angle) };
    // const angleRadians = parseAngleDegreesFromSpec(angle);
    return {
        colors: colors,
        start,
        end,
        angle,
    };
};

const ChatColorValues = {
    ultramarine: {
        id: 'Ultramarine',
        gradient: createGradient(['#0553F0', '#2C6CED'], 0),
        isBuiltIn: true,
        creationTimestamp: 0,
    },
    crimson: {
        id: 'Crimson',
        color: ('#cF163E'),
        isBuiltIn: true,
        creationTimestamp: 1,
    },
    vermilion: {
        id: 'Vermilion',
        color: ('#C73F0A'),
        isBuiltIn: true,
        creationTimestamp: 2,
    },
    burlap: {
        id: 'Burlap',
        color: ('#6F6A58'),
        isBuiltIn: true,
        creationTimestamp: 3,
    },
    forest: {
        id: 'Forest',
        color: ('#3b7845'),
        isBuiltIn: true,
        creationTimestamp: 4,
    },
    wintergreen: {
        id: 'Wintergreen',
        color: ('#1D8663'),
        isBuiltIn: true,
        creationTimestamp: 5,
    },
    teal: {
        id: 'Teal',
        color: ('#077d92'),
        isBuiltIn: true,
        creationTimestamp: 6,
    },
    blue: {
        id: 'Blue',
        color: ('#336ba3'),
        isBuiltIn: true,
        creationTimestamp: 7,
    },
    indigo: {
        id: 'Indigo',
        color: ('#6058ca'),
        isBuiltIn: true,
        creationTimestamp: 8,
    },
    violet: {
        id: 'Violet',
        color: ('#9932c8'),
        isBuiltIn: true,
        creationTimestamp: 9,
    },
    plum: {
        id: 'Plum',
        color: ('#aa377a'),
        isBuiltIn: true,
        creationTimestamp: 10,
    },
    taupe: {
        id: 'Taupe',
        color: ('#8f616a'),
        isBuiltIn: true,
        creationTimestamp: 11,
    },
    steel: {
        id: 'Steel',
        color: ('#71717f'),
        isBuiltIn: true,
        creationTimestamp: 12,
    },
    ember: {
        id: 'Ember',
        gradient: createGradient(['#E57C00', '#5e0000'], ((162 - 180) / 180) * Math.PI),
        isBuiltIn: true,
        creationTimestamp: 13,
    },
    midnight: {
        id: 'Midnight',
        gradient: createGradient(['#2C2C3A', '#787891'], ((180 - 180) / 180) * Math.PI),
        isBuiltIn: true,
        creationTimestamp: 14,
    },
    infrared: {
        id: 'Infrared',
        gradient: createGradient(['#F65560', '#442CED'], ((192 - 180) / 180) * Math.PI),
        isBuiltIn: true,
        creationTimestamp: 15,
    },
    lagoon: {
        id: 'Lagoon',
        gradient: createGradient(['#004066', '#32867D'], ((180 - 180) / 180) * Math.PI),
        isBuiltIn: true,
        creationTimestamp: 16,
    },
    fluorescent: {
        id: 'Fluorescent',
        gradient: createGradient(['#EC13DD', '#1B36C6'], ((192 - 180) / 180) * Math.PI),
        isBuiltIn: true,
        creationTimestamp: 17,
    },
    basil: {
        id: 'Basil',
        gradient: createGradient(['#2F9373', '#077343'], ((180 - 180) / 180) * Math.PI),
        isBuiltIn: true,
        creationTimestamp: 18,
    },
    sublime: {
        id: 'Sublime',
        gradient: createGradient(['#6281D5', '#974460'], ((180 - 180) / 180) * Math.PI),
        isBuiltIn: true,
        creationTimestamp: 19,
    },
    sea: {
        id: 'Sea',
        gradient: createGradient(['#498FD4', '#2C66A0'], ((180 - 180) / 180) * Math.PI),
        isBuiltIn: true,
        creationTimestamp: 20,
    },
    tangerine: {
        id: 'Tangerine',
        gradient: createGradient(['#DB7133', '#911231'], ((192 - 180) / 180) * Math.PI),
        isBuiltIn: true,
        creationTimestamp: 21,
    },
};

export const BUBBLE_COLORS: ChatColor[] = [
    ChatColorValues.ultramarine,
    ChatColorValues.crimson,
    ChatColorValues.vermilion,
    ChatColorValues.burlap,
    ChatColorValues.forest,
    ChatColorValues.wintergreen,
    ChatColorValues.teal,
    ChatColorValues.blue,
    ChatColorValues.indigo,
    ChatColorValues.violet,
    ChatColorValues.plum,
    ChatColorValues.taupe,
    ChatColorValues.steel,
    ChatColorValues.ember,
    ChatColorValues.midnight,
    ChatColorValues.infrared,
    ChatColorValues.lagoon,
    ChatColorValues.fluorescent,
    ChatColorValues.basil,
    ChatColorValues.sublime,
    ChatColorValues.sea,
    ChatColorValues.tangerine,
];
