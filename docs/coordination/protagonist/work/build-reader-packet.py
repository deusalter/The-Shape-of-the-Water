from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[4]
w=Path(__file__).parent
parts=[]; sources=[]
def read_source(file):
 if file.endswith('/P-002-A.md'):
  return (w/'history/P-002-A-before-critique.md').read_text()
 return (root/file).read_text()
def take(file,start,end=None):
 s=read_source(file); a=s.index(start)+len(start); b=s.index(end,a) if end else len(s)
 text=s[a:b].strip(); parts.append(text);sources.append({'file':file,'startAfter':start,'stopBefore':end,'sha256':hashlib.sha256(s.encode()).hexdigest()})
def passage(t):parts.append(t)
f='narrative/loop/BLAISE-FIRST-RETURN.md';m='narrative/loop/RETURN-INVESTIGATION-L3.md';g='narrative/loop/BLAISE-ALLOWED.md';a='docs/coordination/protagonist/work/P-002-A.md'
passage('# Reading\n\n## 1')
take(f,'### Passage\n','Editorial record:')
take(m,'### Passage\n','Acquire `o0-exterior-preparation`')
take(f,'## Crossing\n','### Choice B-R01:')
passage('You choose to say “Blue” before anyone asks you a question.')
take(f,'- **“Say ‘Blue’ before anyone asks you a question.”**','- **“Remain silent')
take(f,'### Common passage\n','### Choice B-R02:')
passage('You choose to describe the crossing and the vanished parcel, distinguishing what you saw from what you think it means.')
take(f,'- **“Describe the crossing and the vanished parcel. Distinguish what you saw from what you think it means.”**','- **“Say you believe')
take(f,'### Passage\n\nAda brings','### Choice B-R03:')
# Restore the literal opening consumed by the distinctive start marker.
parts[-1]='Ada brings '+parts[-1]
passage('You choose to tell her about the touch and the words “There you are,” and ask whether she remembers either.')
take(f,'- **“Tell her about the touch and the words ‘There you are,’ and ask whether she remembers either.”**','- **“Tell her you wanted')
s=(root/f).read_text(); block=s[s.rindex('### Common passage\n')+len('### Common passage\n'):s.index('Editorial consequences:')].strip();parts.append(block)
passage('## 2')
take(m,'### Passage\n\nSimon asks where','### Choice B-R04-A:');parts[-1]='Simon asks where '+parts[-1]
passage('You choose to ask the woman in the coat what happened outside while you were gone.')
take(m,'- **“Ask the woman in the coat to tell you what happened outside while you were gone.”**','- **“Ask Ada')
take(m,'### Common passage\n','Acquire `o1-two-miriams`')
take(m,'### Passage\n\nThe Miriam in','#### If Blaise heard');parts[-1]='The Miriam in '+parts[-1]
take(m,'#### If the private account was refused or never heard\n','#### Common\n')
take(m,'#### Common\n','### Choice B-R05-A:')
passage('You choose to ask how each would like to be addressed while both are present.')
take(m,'- **“Ask how each would like to be addressed while both are present.”**','- **“Tell them you cannot')
take(m,'### Passage\n\nYou tell Simon','### Choice B-R06-A:');parts[-1]='You tell Simon '+parts[-1]
passage('You choose to record that the prepared marked strip remained outside, and that a closely corresponding unmarked strip is now inside.')
take(m,'- **“Record that the prepared marked strip remained outside, and that a closely corresponding unmarked strip is now inside.”**','- **“Say you think')
s=(root/m).read_text();parts.append(s[s.rindex('### Common passage\n')+len('### Common passage\n'):s.index('Transition to BLAISE-ALLOWED')].strip())
passage('## 3')
take(g,'## Passage\n','### Choice L1-G01')
passage('You choose to apologize for making his failure answer the question, and keep the possibility of a gift open.')
take(g,'- **“Apologize for making his failure answer the question. Keep the possibility of a gift open.”**','- **“Say the timing')
take(g,'### Common passage\n','### Choice L1-G02')
passage('You choose to say the present Ada is the person who can answer now, and refuse to call her a replacement.')
take(g,'- **“Say the present Ada is the person who can answer now; refuse to call her a replacement.”**','### Closing passage')
take(g,'### Closing passage\n','Editorial limits:')
passage('## 4')
take(a,'## A1. Beside the sink\n','### A1 choice:')
passage('Available choices:\n\n- Ask her to repeat only what she saw, so you can hold it apart from your own memory.\n- Tell her that hearing the account helped, and leave her free to stop talking.\n\nYou choose the first.')
take(a,'**A1a. “Ask her to repeat only what she saw, so you can hold it apart from your own memory.”**','**A1b.')
take(a,'### Common\n','## A2.')
take(a,'## A2. Keep time\n','### A2 choice:')
passage('Available choices:\n\n- Tell her that for a moment you liked being the only one who remembered.\n- Tell her you are afraid of losing the way she has just learned to wait for your hand.\n\nYou choose the first.')
take(a,'**A2a. “Tell her that for a moment you liked being the only one who remembered.”**','**A2b.')
s=read_source(a);st=s.index('### Common\n',s.index('**A2b.'));en=s.index('## A3.',st);parts.append(s[st+len('### Common\n'):en].strip())
take(a,'## A3. A statement with an audience\n','### A3 choice')
passage('Available choices:\n\n- Keep the conversation with Ada private.\n- Tell both Miriams and Simon that you have promised Ada to tell her before any further crossing; keep the rest private.\n\nYou choose the second.')
take(a,'**A3b. “Tell both Miriams and Simon that you have promised Ada to tell her before any further crossing; keep the rest private.”**','## Authored later consequences')
packet='\n\n'.join(parts)+'\n'
packet=packet.replace('She mentions who was present only if they actually were. ', '')
# Strip indentation inherited from authored response lists, not their literal words.
packet='\n'.join(line[2:] if line.startswith('  ') else line for line in packet.splitlines())+'\n'
for banned in ('Acquire `','Editorial','Entry:','Conditions:','o0-','o1-','Selected male','P-002'):
 assert banned not in packet,banned
(w/'reader').mkdir(exist_ok=True)
packet_path=w/'reader/reading.txt'
if packet_path.exists() and packet_path.read_text()!=packet:
 raise SystemExit('Refusing to overwrite the pinned blind-reader input. Its reviewed source is preserved in history/.')
packet_path.write_text(packet)
(w/'READER-PACKET-MANIFEST.json').write_text(json.dumps({'packet':'reader/reading.txt','sha256':hashlib.sha256(packet.encode()).hexdigest(),'scope':'performed route from pre-return through proposed gap; no endings or author notes; no private first-night confidence','selections':['B-R01 Blue','B-R02 bounded account','B-R03 remembered contact','B-R04 exterior account','B-R05 address by name','B-R06 bounded material finding','L1-G01 apology','L1-G02 present Ada','A1a','A2a','A3b'],'extractionSources':sources},indent=2)+'\n')
print('Player-only packet:',len(packet.split()),'words;',hashlib.sha256(packet.encode()).hexdigest())
