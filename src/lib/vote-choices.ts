export const VOTE_CHOICES = [
  { id: 1,  label: 'アナ → ジャスミン',   first: 'ana',     second: 'jasmine' },
  { id: 2,  label: 'アナ → エルサ',       first: 'ana',     second: 'elsa'    },
  { id: 3,  label: 'アナ → アリエル',     first: 'ana',     second: 'ariel'   },
  { id: 4,  label: 'エルサ → ジャスミン', first: 'elsa',    second: 'jasmine' },
  { id: 5,  label: 'エルサ → アナ',       first: 'elsa',    second: 'ana'     },
  { id: 6,  label: 'エルサ → アリエル',   first: 'elsa',    second: 'ariel'   },
  { id: 7,  label: 'ジャスミン → アナ',   first: 'jasmine', second: 'ana'     },
  { id: 8,  label: 'ジャスミン → エルサ', first: 'jasmine', second: 'elsa'    },
  { id: 9,  label: 'ジャスミン → アリエル', first: 'jasmine', second: 'ariel' },
  { id: 10, label: 'アリエル → ジャスミン', first: 'ariel',   second: 'jasmine' },
  { id: 11, label: 'アリエル → アナ',     first: 'ariel',   second: 'ana'     },
  { id: 12, label: 'アリエル → エルサ',   first: 'ariel',   second: 'elsa'    },
] as const

export const CORRECT_CHOICE_ID = 7

export const PRINCESS_NAMES: Record<string, string> = {
  jasmine: 'ジャスミン',
  ana:     'アナ',
  elsa:    'エルサ',
  ariel:   'アリエル',
}
