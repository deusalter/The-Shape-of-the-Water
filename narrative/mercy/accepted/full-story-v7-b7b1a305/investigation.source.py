from authoring import Module, choice
m=Module("investigation")

m.scene("a1.empty-theatre","No answer",'''Blaise called Julian's name before he reached the door. He wanted the encounter to begin with an ordinary sound.

The horse was gone.

There should have been a smaller version of it near the wardrobe, the one Julian had begun before the dedication morning. There should have been a painted door at the back of the room. There should have been a cart in the narrow passage outside. Blaise had helped bring the cart there before the morning Erasmus could restore. He remembered cutting his thumb on its rough side.

The cupboard stood open. The little hook on which Julian hung his coat was empty. Light came through the window in the position Blaise remembered. That exactness made the absences harder to bear.

“Julian?”

He looked in the cupboard, absurdly. It contained the broken umbrella and a strip of red cloth. At the washstand the cup was where it had been, and Blaise disliked it for having made the journey safely.

He had imagined the first words so often that a response seemed delayed rather than missing. The room ought to have answered. He nearly said Julian's next line aloud to supply the gap.

Instead he went to the passage. The cart wheels had once made two dark lines there. They were still visible in the wood of the threshold. On the dedication morning the cart had stood over them.

It was possible that Julian had gone out already. Blaise held this explanation for several breaths without asking whether he believed it.

Then he went back to Erasmus.''',[
choice("a1.report-absence","Tell Erasmus that Julian, the cart and the scenery are absent.","a1.withdrawal",actions=[{"type":"disclose","characterId":"blaise","refId":"src.empty-theatre"},{"type":"disclose","characterId":"erasmus","refId":"src.empty-theatre"}])
],actors=["blaise"],location="theatre",props=["empty-doorway","empty-coat-hook","cup"],sourceIds=["src.empty-theatre"])

m.scene("a1.withdrawal","What Erasmus says happened",'''Erasmus was standing beside the beans. He had not begun preparing them.

“He isn't there,” Blaise said. “Neither is the cart.”

“I know he isn't there.”

“How?”

The patron laid a hand flat on the counter. Blaise found himself looking at the hand as though it might be an instrument from which an answer could be read.

“I felt him withdraw,” Erasmus said.

“Withdraw where?”

“I don't mean a place.”

“Then say what you mean.”

“He would not occupy the life that was offered. Sometimes a creature refuses more completely than we can understand.”

Blaise sat down. The beans made an unreasonable amount of noise when Erasmus moved the pot away from the edge.

“Are you saying he doesn't exist?”

“I cannot bring him here.”

“Those are different things.”

“They are different things to say.”

The distinction had been made to sound merely verbal. Blaise knew the pleasure of making an objection seem too small for the occasion; he had done it to Julian. Hearing it now did not make him better at resisting it.

He imagined a refusal so total that it had removed the person who could make it. The horror was not simply death. Even death would have allowed him to continue wanting someone. Erasmus was proposing that Julian had made Blaise's desire an address with no possible recipient.

“He took a cart,” Blaise said.

“You saw him leave the room.”

“Why would a man take a cart to not exist?”

For the first time, Erasmus seemed impatient with the object. Blaise stood up before the patron could supply a meaning for it.

“I'm going to look.”

“You may find things you won't want to bring back.”

“That would be better than not finding him.”

He was not sure that was true. He left while he could still use it.''',[
choice("a1.return-to-traces","Return to the theatre and inspect what is missing.","a1.painted-place",actions=[{"type":"disclose","characterId":"blaise","refId":"src.withdrawal-claim"}])
],actors=["blaise","erasmus"],location="palace",props=["bean-pot","whole-bowl"],sourceIds=["src.withdrawal-claim"])

m.scene("a1.painted-place","The things that went with him",'''The hinge pins lay on the stage.

Julian had used lift-off hinges for the painted door because the scenery was meant to travel. Blaise remembered objecting to the expense. He had wanted it to look permanent. The fact returned to him with an embarrassment out of proportion to its practical significance.

There were older marks around the fittings, a blue edge from the first coat of paint, a semicircle worn into the floor. The door had been here on the dedication morning. Its present absence could not be explained merely by saying that later work had been undone.

Blaise found one of Julian's written reminders beneath the wardrobe: check width before painting. The paper belonged to work begun before the morning. It said nothing about leaving. He wanted it to, and caught himself preparing to treat the handwriting as a message intended for this search.

He put it back.

Julian had said he was taking the door to Vera. The astronomer worked near the edge, where a narrow stair opened onto the part of the curved sky one could walk upon. If Julian had reached her, she might know something. Unless the return had taken that knowledge too.

For a moment the thought made looking seem pointless. Every witness inside could have been deprived of the event he needed them to remember. Yet the cart had gone with the door. Things could cross the edge. A history might have left something where the morning could not reach it.

Blaise took the narrow stair.''',[
choice("a1.climb-to-vera","Climb to Vera's instruments at the city's edge.","a1.vera-box",actions=[{"type":"disclose","characterId":"blaise","refId":"src.door-before-anchor"}])
],actors=["blaise"],location="theatre",props=["empty-doorway","hinge-pins","old-reminder"],sourceIds=["src.door-before-anchor"])

m.scene("a1.vera-box","A habit that returns",'''Vera was sitting beside a box with her breakfast in her lap. The lid supported a telescope, three pieces of cloth and a cup which had already left a ring on one of the pieces.

“Have I invited you?” she asked.

“No.”

“Good. Then I haven't forgotten my manners as well.”

Below them, Aubade curved inward. The houses nearest the square looked upright; the distant roofs seemed to be hanging from the sky. On the other side of the narrow ridge the land opened into a country of dark grass. A wall of rain stood in the distance without visibly approaching.

Vera turned a page and found something which made her swear quietly.

“Did Julian come to you?” Blaise asked.

“According to this, yes. According to me, I was about to have breakfast before you arrived.”

She showed him the notebook. On the dedication morning, she had already been keeping her instruments on this side of the ridge, where the outside wind made them less pleasant to use but the view was better. It was a habit older than the power's intervention. Every restored morning sent her up the same stair to find whatever her later self had left in the box.

“You believe the notes?”

“I read them. Then I try the things which can still be tried. My handwriting isn't a guarantee that I've become sensible.”

Blaise took the page she offered. It described a conversation with Julian about a line from his play. It included the word weeds, underlined, and a less charitable description of Blaise than he would have chosen for an independent witness.

Vera watched him reach that part.

“I did say I don't believe everything merely because I wrote it.”

“Did you tell him to go?”

“The note says I showed him the outside marks and told him how to follow the road to the rain. I don't remember telling him.”

“You could have warned me.”

“I may have. You appear to have had an advantage in that department.”

He folded the page, then unfolded it because it was hers.

The box was not a magical store of the truth. He could see corrections, failed predictions about cloud cover and an irritable note warning Vera not to trust a particular knot. It contained a continuing inquiry, including mistakes, where her present memory contained a beginning.

“Erasmus says Julian has withdrawn from existence,” Blaise said.

Vera looked across the dark grass.

“And took the door?”''',[
choice("a1.read-boundary","Ask Vera to show the observations behind the notebook's account.","a1.observations",actions=[{"type":"disclose","characterId":"blaise","refId":"src.vera-log"},{"type":"disclose","characterId":"vera-witness","refId":"src.withdrawal-claim"}])
],actors=["blaise","vera-witness"],location="edge",props=["instrument-box","telescope","sky-cloth","notebook","breakfast-cup"],sourceIds=["src.vera-log"])

m.scene("a1.observations","A sky which went on",'''Vera spread the cloth on the dry side of the box. Its marks described the highest city terraces and several stars beyond them. Some had been crossed out. Others appeared in groups, a repeated arrangement of the city with a changing outer sky.

“I began by thinking my instruments were bad,” she said. “They are bad. I make them myself. That accounted for quite a lot.”

“But not all of it.”

“The most seductive sentence in an investigation.”

She pointed to a stitched corner. The earlier cloth had been marked on the dedication morning. Later observations were added after it had been brought outside. A corresponding cloth left within the city retained the earlier marks after a return and lost the additions. The record described the comparison, including a trial which had failed because Vera carried both pieces back inside to keep them out of a storm.

Blaise could inspect the surviving marks and the location of the box. He had not witnessed every earlier comparison. Vera did not pretend he had. Their value for the search was narrower than he wanted: there was a plausible way for things beyond the edge to carry forward an event the city no longer displayed.

“What did you hope this would prove?” he asked.

“That the stars didn't need Erasmus to put them there. He once told me I was studying the furniture.”

“And if he admits he didn't make them?”

“I expect I shall be insufferable for some time.”

She said it happily. Blaise liked her more for the confession and less for how easily she could make it.

There was a sketch beneath the cloth. Julian had drawn a stage under the edge of the standing rain. Beside it he had put a small, severe figure among too many stars.

“That's you,” Blaise said.

“The intention is flattering. The likeness is criminal.”

“Are you going?”

“When I've shown what I've found here. I want them to know why.”

“You mean Erasmus.”

She took the sketch from him.

“I mean quite a few people.”

The last page contained the route Julian had been given. It followed the broad road from the ridge, passed the market in the dry hollow of the rain and ended at the new theatre. Blaise did not need a complete explanation of the stars to follow it.

Vera put a piece of bread in his hand as he got up.

“You will be unpleasant if you don't eat.”

“And if I do?”

“We mustn't promise too much.”''',[
choice("a1.take-west-road","Follow the route Julian was given.","a1.west-road",actions=[{"type":"disclose","characterId":"blaise","refId":"src.outer-records"},{"type":"disclose","characterId":"vera-witness","refId":"src.vera-log"},{"type":"disclose","characterId":"vera-witness","refId":"src.outer-records"}])
],actors=["blaise","vera-witness"],location="edge",props=["instrument-box","sky-cloth","notebook","stage-sketch"],sourceIds=["src.outer-records"])

m.scene("a1.west-road","The country beside the morning",'''The first strange thing outside was not a monster or a change in the light. It was a man trying to persuade a goat to continue in the same direction as his cart.

Blaise could have passed them. Instead he spent several minutes on the wrong side of the animal, attempting to look like a reason it should move. The man told him he was making the goat interested in staying. Blaise moved away. The goat followed the cart.

He ate Vera's bread as he walked.

The road bent around the outer surface of the city. From here the upper terraces looked almost ordinary, supported by a curve whose other side contained the square. The view did not reveal which side was the real one. Both were available to a person who moved far enough to see them.

He had half expected departure to feel like waking. Instead his feet hurt in a familiar way. The country had its own air, distances, people who did not owe him an explanation of their presence. Whatever he found here would still be something he had to encounter under the conditions of encountering anything.

The wall of rain grew larger. It was not perfectly still. Water moved downward within it, while the edge remained in place. A woman stood just outside the wetness washing a sheet. She leaned in, soaked the cloth, then stepped back into the dry air and shook it out.

Blaise waited until she had finished before asking about Julian's cart. She pointed with the sheet, nearly striking him.

“Painted door?”

“Yes.”

“They tried it across the stream. It wasn't a bridge.”

“Was anyone hurt?”

“Only the door, I think. They were laughing too much to explain.”

The news made him glad. Then he resented having missed the laughter. Both feelings arrived before he had time to approve either.

He followed the edge of the rain toward the sound of a market.''',[
choice("a1.enter-market","Enter the market and look for the company.","a1.rain-market")
],actors=["blaise"],location="west-road",props=["bread","standing-rain"])

m.source("src.empty-theatre","After the first return: Julian and the scenery are absent","Blaise found the theatre without Julian, the cart, the paper horse or painted door after the city was restored. The old cup and other contents remained. Absence alone does not establish where Julian is.",provenance="first-empty-theatre")
m.source("src.withdrawal-claim","Erasmus's account of Julian's absence","Erasmus said he felt Julian withdraw and described a refusal to occupy the offered life. When asked whether Julian did not exist, he said he could not bring him here. Blaise challenged the equivalence.",kind="statement",provenance="erasmus-withdrawal-account",speakerId="erasmus")
m.source("src.door-before-anchor","The door belonged to the dedication morning","Blaise remembers the cart and painted door being in Aubade before the dedication morning. Their old fittings and floor marks remain. They are not simply later work which a return would undo.",provenance="blaise-anchor-objects")
m.source("src.vera-log","Vera's exterior record of Julian's visit","A notebook kept outside the city's edge records that Julian consulted Vera about Blaise knowing an unwritten line, saw her records, and received directions to the theatre beside the standing rain. Present Vera reads this record rather than remembering the visit.",kind="document",provenance="vera-exterior-log")
m.source("src.outer-records","Records beyond the city's edge","Vera showed successive observations kept beyond the edge and a record of comparisons with cloth left inside. The surviving marks and box can be inspected; Blaise did not witness all the earlier trials. The record supports investigating continued exterior history rather than treating the city as the whole world.",kind="document",provenance="vera-exterior-log")
m.write(evidence="The notebook and its repeated summary share one provenance. Missing objects raise a physical alternative, not a proof against every metaphysical claim. Julian alive will settle the bounded disappearance.")
