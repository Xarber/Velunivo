export function conventionalChanges(subject) {
  return subject.split(/;\s*(?=\w+(?:\([^)]+\))?!?: )/).map(clause => {
    const match = /^(\w+)(?:\(([^)]+)\))?(!)?: (.+)$/.exec(clause.trim());
    return match ? { type: match[1], text: `${match[3] ? 'BREAKING: ' : ''}${match[2] ? `${match[2]}: ` : ''}${match[4]}` } : { type: 'other', text: clause.trim() };
  });
}
