// ============================================================
// data.js — Pre-populated seed data
// 100 Official USCIS Civics Questions + N-400 Interview Qs
// ============================================================
// This data is loaded into Firestore the FIRST TIME a teacher
// logs in (see seedDatabase() in app.js).
// You can add more variations later via the Teacher Panel.
// ============================================================

/* ── Default Sections ─────────────────────────────────────── */
const DEFAULT_SECTIONS = [
  { id:'sec-follow',   name:'Following Instructions',   icon:'🖐️', colorClass:'sc-follow',   order:1, prerequisite:null },
  { id:'sec-n400',     name:'Answering N-400 Questions', icon:'📋', colorClass:'sc-n400',     order:2, prerequisite:'sec-follow' },
  { id:'sec-reading',  name:'English — Reading',         icon:'📖', colorClass:'sc-reading',  order:3, prerequisite:'sec-n400' },
  { id:'sec-writing',  name:'English — Writing',         icon:'✏️', colorClass:'sc-writing',  order:4, prerequisite:'sec-reading' },
  { id:'sec-vocread',  name:'Vocabulary — Reading Exam', icon:'🔤', colorClass:'sc-vocread',  order:5, prerequisite:'sec-writing' },
  { id:'sec-vocwrite', name:'Vocabulary — Writing',      icon:'📝', colorClass:'sc-vocwrite', order:6, prerequisite:'sec-vocread' },
  { id:'sec-vocn400',  name:'Vocabulary — N-400 Form',   icon:'📄', colorClass:'sc-vocn400',  order:7, prerequisite:'sec-vocwrite' },
  { id:'sec-history',  name:'Vocabulary — History & Gov',icon:'🏛️', colorClass:'sc-history',  order:8, prerequisite:'sec-vocn400' },
];

/* ── 100 Official USCIS Civics Questions ──────────────────── */
// Format: { id, q (question), a (answer), cat (category) }
// Audio URLs are empty — add them via Teacher Panel.
const CIVICS_QUESTIONS = [
  // AMERICAN GOVERNMENT — Principles of American Democracy
  {id:'c1',  q:'What is the supreme law of the land?', a:'The Constitution', cat:'Principles of American Democracy'},
  {id:'c2',  q:'What does the Constitution do?', a:'Sets up the government, defines the government, protects basic rights of Americans', cat:'Principles of American Democracy'},
  {id:'c3',  q:'The idea of self-government is in the first three words of the Constitution. What are these words?', a:'We the People', cat:'Principles of American Democracy'},
  {id:'c4',  q:'What is an amendment?', a:'A change to the Constitution / an addition to the Constitution', cat:'Principles of American Democracy'},
  {id:'c5',  q:'What do we call the first ten amendments to the Constitution?', a:'The Bill of Rights', cat:'Principles of American Democracy'},
  {id:'c6',  q:'What is one right or freedom from the First Amendment?', a:'Speech, religion, assembly, press, or petition the government', cat:'Principles of American Democracy'},
  {id:'c7',  q:'How many amendments does the Constitution have?', a:'Twenty-seven (27)', cat:'Principles of American Democracy'},
  {id:'c8',  q:'What did the Declaration of Independence do?', a:'Announced our independence from Great Britain', cat:'Principles of American Democracy'},
  {id:'c9',  q:'What are two rights in the Declaration of Independence?', a:'Life, liberty, and the pursuit of happiness', cat:'Principles of American Democracy'},
  {id:'c10', q:'What is freedom of religion?', a:'You can practice any religion, or not practice a religion', cat:'Principles of American Democracy'},
  {id:'c11', q:'What is the economic system in the United States?', a:'Capitalist economy / market economy', cat:'Principles of American Democracy'},
  {id:'c12', q:'What is the "rule of law"?', a:'Everyone must follow the law. No one is above the law.', cat:'Principles of American Democracy'},
  // System of Government
  {id:'c13', q:'Name one branch or part of the government.', a:'Congress / legislative / President / executive / the courts / judicial', cat:'System of Government'},
  {id:'c14', q:'What stops one branch of government from becoming too powerful?', a:'Checks and balances / separation of powers', cat:'System of Government'},
  {id:'c15', q:'Who is in charge of the executive branch?', a:'The President', cat:'System of Government'},
  {id:'c16', q:'Who makes federal laws?', a:'Congress / Senate and House of Representatives', cat:'System of Government'},
  {id:'c17', q:'What are the two parts of the U.S. Congress?', a:'The Senate and House of Representatives', cat:'System of Government'},
  {id:'c18', q:'How many U.S. Senators are there?', a:'One hundred (100)', cat:'System of Government'},
  {id:'c19', q:'We elect a U.S. Senator for how many years?', a:'Six (6)', cat:'System of Government'},
  {id:'c20', q:'Who is one of your state\'s U.S. Senators now?', a:'(Answers will vary by state)', cat:'System of Government'},
  {id:'c21', q:'The House of Representatives has how many voting members?', a:'Four hundred thirty-five (435)', cat:'System of Government'},
  {id:'c22', q:'We elect a U.S. Representative for how many years?', a:'Two (2)', cat:'System of Government'},
  {id:'c23', q:'Name your U.S. Representative.', a:'(Answers will vary by district)', cat:'System of Government'},
  {id:'c24', q:'Who does a U.S. Senator represent?', a:'All people of the state', cat:'System of Government'},
  {id:'c25', q:'Why do some states have more Representatives than other states?', a:'Because of the state\'s population / because some states have more people', cat:'System of Government'},
  {id:'c26', q:'We elect a President for how many years?', a:'Four (4)', cat:'System of Government'},
  {id:'c27', q:'In what month do we vote for President?', a:'November', cat:'System of Government'},
  {id:'c28', q:'What is the name of the President of the United States now?', a:'(Current President — check uscis.gov for current answer)', cat:'System of Government'},
  {id:'c29', q:'What is the name of the Vice President of the United States now?', a:'(Current VP — check uscis.gov for current answer)', cat:'System of Government'},
  {id:'c30', q:'If the President can no longer serve, who becomes President?', a:'The Vice President', cat:'System of Government'},
  {id:'c31', q:'If both the President and the Vice President can no longer serve, who becomes President?', a:'The Speaker of the House', cat:'System of Government'},
  {id:'c32', q:'Who is the Commander in Chief of the military?', a:'The President', cat:'System of Government'},
  {id:'c33', q:'Who signs bills to become laws?', a:'The President', cat:'System of Government'},
  {id:'c34', q:'Who vetoes bills?', a:'The President', cat:'System of Government'},
  {id:'c35', q:'What does the President\'s Cabinet do?', a:'Advises the President', cat:'System of Government'},
  {id:'c36', q:'What are two Cabinet-level positions?', a:'Secretary of State, Secretary of Defense (any two Cabinet positions)', cat:'System of Government'},
  {id:'c37', q:'What does the judicial branch do?', a:'Reviews laws, explains laws, resolves disputes, decides if a law goes against the Constitution', cat:'System of Government'},
  {id:'c38', q:'What is the highest court in the United States?', a:'The Supreme Court', cat:'System of Government'},
  {id:'c39', q:'How many justices are on the Supreme Court?', a:'Nine (9)', cat:'System of Government'},
  {id:'c40', q:'Who is the Chief Justice of the United States now?', a:'(Current Chief Justice — check uscis.gov)', cat:'System of Government'},
  {id:'c41', q:'Under our Constitution, some powers belong to the federal government. What is one power of the federal government?', a:'To print money / to declare war / to create an army / to make treaties', cat:'System of Government'},
  {id:'c42', q:'Under our Constitution, some powers belong to the states. What is one power of the states?', a:'Provide schooling / provide protection (police) / give a driver\'s license / approve zoning', cat:'System of Government'},
  {id:'c43', q:'Who is the Governor of your state now?', a:'(Answers will vary by state)', cat:'System of Government'},
  {id:'c44', q:'What is the capital of your state?', a:'(Answers will vary by state)', cat:'System of Government'},
  {id:'c45', q:'What are the two major political parties in the United States?', a:'Democratic and Republican', cat:'System of Government'},
  {id:'c46', q:'What is the political party of the President now?', a:'(Answers will vary — check current)', cat:'System of Government'},
  {id:'c47', q:'What is the name of the Speaker of the House of Representatives now?', a:'(Current Speaker — check uscis.gov)', cat:'System of Government'},
  // Rights and Responsibilities
  {id:'c48', q:'There are four amendments to the Constitution about who can vote. Describe one of them.', a:'Citizens eighteen and older can vote. / You don\'t have to pay a poll tax to vote. / Any citizen can vote. / A male citizen of any race can vote.', cat:'Rights and Responsibilities'},
  {id:'c49', q:'What is one responsibility that is only for United States citizens?', a:'Serve on a jury / vote in a federal election', cat:'Rights and Responsibilities'},
  {id:'c50', q:'Name one right only for United States citizens.', a:'Vote in a federal election / run for federal office', cat:'Rights and Responsibilities'},
  {id:'c51', q:'What are two rights of everyone living in the United States?', a:'Freedom of expression / freedom of speech / freedom of assembly / freedom of religion / the right to bear arms', cat:'Rights and Responsibilities'},
  {id:'c52', q:'What do we show loyalty to when we say the Pledge of Allegiance?', a:'The United States / the flag', cat:'Rights and Responsibilities'},
  {id:'c53', q:'What is one promise you make when you become a United States citizen?', a:'Give up loyalty to other countries / defend the Constitution / obey the laws / serve in the U.S. military if needed / be loyal to the United States', cat:'Rights and Responsibilities'},
  {id:'c54', q:'How old do citizens have to be to vote for President?', a:'Eighteen (18) and older', cat:'Rights and Responsibilities'},
  {id:'c55', q:'What are two ways that Americans can participate in their democracy?', a:'Vote / join a political party / help with a campaign / join a civic group / call Senators and Representatives / run for office / write to a newspaper', cat:'Rights and Responsibilities'},
  {id:'c56', q:'When is the last day you can send in federal income tax forms?', a:'April 15', cat:'Rights and Responsibilities'},
  {id:'c57', q:'When must all men register for the Selective Service?', a:'At age eighteen (18) / between eighteen (18) and twenty-six (26)', cat:'Rights and Responsibilities'},
  // AMERICAN HISTORY — Colonial Period and Independence
  {id:'c58', q:'What is one reason colonists came to America?', a:'Freedom / political liberty / religious freedom / economic opportunity / escape persecution', cat:'Colonial Period and Independence'},
  {id:'c59', q:'Who lived in America before the Europeans arrived?', a:'American Indians / Native Americans', cat:'Colonial Period and Independence'},
  {id:'c60', q:'What group of people was taken to America and sold as slaves?', a:'Africans / people from Africa', cat:'Colonial Period and Independence'},
  {id:'c61', q:'Why did the colonists fight the British?', a:'Because of high taxes (taxation without representation) / because the British army stayed in their houses / because they didn\'t have self-government', cat:'Colonial Period and Independence'},
  {id:'c62', q:'Who wrote the Declaration of Independence?', a:'(Thomas) Jefferson', cat:'Colonial Period and Independence'},
  {id:'c63', q:'When was the Declaration of Independence adopted?', a:'July 4, 1776', cat:'Colonial Period and Independence'},
  {id:'c64', q:'There were 13 original states. Name three.', a:'New Hampshire, Massachusetts, Rhode Island, Connecticut, New York, New Jersey, Pennsylvania, Delaware, Maryland, Virginia, North Carolina, South Carolina, Georgia', cat:'Colonial Period and Independence'},
  {id:'c65', q:'What happened at the Constitutional Convention?', a:'The Constitution was written / the Founding Fathers wrote the Constitution', cat:'Colonial Period and Independence'},
  {id:'c66', q:'When was the Constitution written?', a:'1787', cat:'Colonial Period and Independence'},
  {id:'c67', q:'The Federalist Papers supported the passage of the U.S. Constitution. Name one of the writers.', a:'(James) Madison / (Alexander) Hamilton / (John) Jay / Publius', cat:'Colonial Period and Independence'},
  {id:'c68', q:'What is one thing Benjamin Franklin is famous for?', a:'U.S. diplomat / oldest member of the Constitutional Convention / first Postmaster General / writer of "Poor Richard\'s Almanac" / started the first free libraries', cat:'Colonial Period and Independence'},
  {id:'c69', q:'Who is the "Father of Our Country"?', a:'(George) Washington', cat:'Colonial Period and Independence'},
  {id:'c70', q:'Who was the first President?', a:'(George) Washington', cat:'Colonial Period and Independence'},
  // 1800s
  {id:'c71', q:'What territory did the United States buy from France in 1803?', a:'The Louisiana Territory / Louisiana', cat:'1800s'},
  {id:'c72', q:'Name one war fought by the United States in the 1800s.', a:'War of 1812 / Mexican-American War / Civil War / Spanish-American War', cat:'1800s'},
  {id:'c73', q:'Give the name of one of the two sides in the Civil War.', a:'The Union / the North / the Confederacy / the South', cat:'1800s'},
  {id:'c74', q:'Name one problem that led to the Civil War.', a:'Slavery / economic reasons / states\' rights', cat:'1800s'},
  {id:'c75', q:'What was one important thing that Abraham Lincoln did?', a:'Freed the slaves (Emancipation Proclamation) / saved the Union / led the United States during the Civil War', cat:'1800s'},
  {id:'c76', q:'What did the Emancipation Proclamation do?', a:'Freed the slaves / freed slaves in the Confederacy / freed slaves in most Southern states', cat:'1800s'},
  {id:'c77', q:'What did Susan B. Anthony do?', a:'Fought for women\'s rights / fought for civil rights', cat:'1800s'},
  // Recent History
  {id:'c78', q:'Name one war fought by the United States in the 1900s.', a:'World War I / World War II / Korean War / Vietnam War / (Persian) Gulf War', cat:'Recent American History'},
  {id:'c79', q:'Who was President during World War I?', a:'(Woodrow) Wilson', cat:'Recent American History'},
  {id:'c80', q:'Who was President during the Great Depression and World War II?', a:'(Franklin) Roosevelt', cat:'Recent American History'},
  {id:'c81', q:'Who did the United States fight in World War II?', a:'Japan, Germany, and Italy', cat:'Recent American History'},
  {id:'c82', q:'Before he was President, Eisenhower was a general. What war was he in?', a:'World War II', cat:'Recent American History'},
  {id:'c83', q:'During the Cold War, what was the main concern of the United States?', a:'Communism', cat:'Recent American History'},
  {id:'c84', q:'What movement tried to end racial discrimination?', a:'Civil rights (movement)', cat:'Recent American History'},
  {id:'c85', q:'What did Martin Luther King, Jr. do?', a:'Fought for civil rights / worked for equality for all Americans', cat:'Recent American History'},
  {id:'c86', q:'What major event happened on September 11, 2001, in the United States?', a:'Terrorists attacked the United States', cat:'Recent American History'},
  {id:'c87', q:'Name one American Indian tribe in the United States.', a:'Cherokee, Navajo, Sioux, Chippewa, Choctaw, Pueblo, Apache, Iroquois, Creek, Seminole, Cheyenne, Hopi, Inuit (and others)', cat:'Recent American History'},
  // INTEGRATED CIVICS — Geography
  {id:'c88', q:'Name one of the two longest rivers in the United States.', a:'Missouri (River) / Mississippi (River)', cat:'Geography'},
  {id:'c89', q:'What ocean is on the West Coast of the United States?', a:'Pacific (Ocean)', cat:'Geography'},
  {id:'c90', q:'What ocean is on the East Coast of the United States?', a:'Atlantic (Ocean)', cat:'Geography'},
  {id:'c91', q:'Name one U.S. territory.', a:'Puerto Rico / U.S. Virgin Islands / American Samoa / Northern Mariana Islands / Guam', cat:'Geography'},
  {id:'c92', q:'Name one state that borders Canada.', a:'Maine, New Hampshire, Vermont, New York, Pennsylvania, Ohio, Michigan, Minnesota, North Dakota, Montana, Idaho, Washington, Alaska', cat:'Geography'},
  {id:'c93', q:'Name one state that borders Mexico.', a:'California, Arizona, New Mexico, Texas', cat:'Geography'},
  {id:'c94', q:'What is the capital of the United States?', a:'Washington, D.C.', cat:'Geography'},
  {id:'c95', q:'Where is the Statue of Liberty?', a:'New York (Harbor) / Liberty Island', cat:'Geography'},
  // Symbols
  {id:'c96', q:'Why does the flag have 13 stripes?', a:'Because there were 13 original colonies / the stripes represent the original colonies', cat:'Symbols'},
  {id:'c97', q:'Why does the flag have 50 stars?', a:'Because there is one star for each state / because there are 50 states', cat:'Symbols'},
  {id:'c98', q:'What is the name of the national anthem?', a:'The Star-Spangled Banner', cat:'Symbols'},
  // Holidays
  {id:'c99',  q:'When do we celebrate Independence Day?', a:'July 4', cat:'Holidays'},
  {id:'c100', q:'Name two national U.S. holidays.', a:'New Year\'s Day, Martin Luther King Jr. Day, Presidents\' Day, Memorial Day, Juneteenth, Independence Day, Labor Day, Veterans Day, Thanksgiving, Christmas', cat:'Holidays'},
];

/* ── N-400 Interview Questions ───────────────────────────── */
// Format: { id, q (standard question), cat (category) }
// Add your own audio and variations via Teacher Panel.
const N400_QUESTIONS = [
  // Personal Information
  {id:'n1',  q:'What is your full legal name?', cat:'Personal Information'},
  {id:'n2',  q:'Have you ever used any other names?', cat:'Personal Information'},
  {id:'n3',  q:'What is your home address?', cat:'Personal Information'},
  {id:'n4',  q:'How long have you lived at this address?', cat:'Personal Information'},
  {id:'n5',  q:'What is your date of birth?', cat:'Personal Information'},
  {id:'n6',  q:'What country were you born in?', cat:'Personal Information'},
  {id:'n7',  q:'What is your Social Security number?', cat:'Personal Information'},
  {id:'n8',  q:'What is your phone number?', cat:'Personal Information'},
  // Residency & Eligibility
  {id:'n9',  q:'When did you become a Lawful Permanent Resident?', cat:'Residency & Eligibility'},
  {id:'n10', q:'How long have you been a permanent resident of the United States?', cat:'Residency & Eligibility'},
  {id:'n11', q:'Have you taken any trips outside the United States in the last five years?', cat:'Residency & Eligibility'},
  {id:'n12', q:'How long were you outside of the United States?', cat:'Residency & Eligibility'},
  {id:'n13', q:'What countries did you visit?', cat:'Residency & Eligibility'},
  {id:'n14', q:'Why did you leave the United States?', cat:'Residency & Eligibility'},
  // Marital Status & Family
  {id:'n15', q:'Are you currently married?', cat:'Marital Status & Family'},
  {id:'n16', q:'What is your spouse\'s name?', cat:'Marital Status & Family'},
  {id:'n17', q:'When did you get married?', cat:'Marital Status & Family'},
  {id:'n18', q:'Where did you get married?', cat:'Marital Status & Family'},
  {id:'n19', q:'Is your spouse a U.S. citizen?', cat:'Marital Status & Family'},
  {id:'n20', q:'Have you ever been divorced?', cat:'Marital Status & Family'},
  {id:'n21', q:'Do you have any children?', cat:'Marital Status & Family'},
  {id:'n22', q:'How many children do you have?', cat:'Marital Status & Family'},
  // Employment
  {id:'n23', q:'Are you currently employed?', cat:'Employment'},
  {id:'n24', q:'Where do you work?', cat:'Employment'},
  {id:'n25', q:'What do you do for work?', cat:'Employment'},
  {id:'n26', q:'Have you filed your federal income taxes every year?', cat:'Employment'},
  // Good Moral Character
  {id:'n27', q:'Have you ever been arrested or cited by a police officer?', cat:'Good Moral Character'},
  {id:'n28', q:'Have you ever been convicted of a crime?', cat:'Good Moral Character'},
  {id:'n29', q:'Have you ever been in jail or prison?', cat:'Good Moral Character'},
  {id:'n30', q:'Are you a member of any organizations or groups?', cat:'Good Moral Character'},
  {id:'n31', q:'Have you ever been a member of the Communist Party?', cat:'Good Moral Character'},
  {id:'n32', q:'Have you ever claimed to be a U.S. citizen?', cat:'Good Moral Character'},
  {id:'n33', q:'Have you ever voted in a U.S. federal election?', cat:'Good Moral Character'},
  {id:'n34', q:'Have you ever served in the U.S. military?', cat:'Good Moral Character'},
  // Oath & Commitment
  {id:'n35', q:'Do you support the Constitution and form of government of the United States?', cat:'Oath & Commitment'},
  {id:'n36', q:'Are you willing to take the full Oath of Allegiance to the United States?', cat:'Oath & Commitment'},
  {id:'n37', q:'If the law requires it, are you willing to bear arms on behalf of the United States?', cat:'Oath & Commitment'},
  {id:'n38', q:'Are you willing to perform noncombatant services in the armed forces of the United States?', cat:'Oath & Commitment'},
  {id:'n39', q:'Are you willing to help the government during a national emergency?', cat:'Oath & Commitment'},
  {id:'n40', q:'Do you understand the full Oath of Allegiance?', cat:'Oath & Commitment'},
];

/* ── Following Instructions Cards (starter set) ─────────── */
// Front: image + audio. Back: written English + Russian.
// Add your own images & audio via Teacher Panel.
const FOLLOWING_INSTRUCTIONS = [
  {id:'fi1', english:'Raise your right hand.',   russian:'Поднимите правую руку.',    imageUrl:'', audioUrl:''},
  {id:'fi2', english:'Raise your left hand.',    russian:'Поднимите левую руку.',     imageUrl:'', audioUrl:''},
  {id:'fi3', english:'Sit down.',                russian:'Садитесь.',                  imageUrl:'', audioUrl:''},
  {id:'fi4', english:'Stand up.',                russian:'Встаньте.',                  imageUrl:'', audioUrl:''},
  {id:'fi5', english:'Come in.',                 russian:'Войдите.',                   imageUrl:'', audioUrl:''},
  {id:'fi6', english:'Follow me.',               russian:'Следуйте за мной.',          imageUrl:'', audioUrl:''},
  {id:'fi7', english:'Please wait here.',        russian:'Пожалуйста, подождите здесь.', imageUrl:'', audioUrl:''},
  {id:'fi8', english:'Sign your name here.',     russian:'Подпишитесь здесь.',         imageUrl:'', audioUrl:''},
  {id:'fi9', english:'Write your name.',         russian:'Напишите ваше имя.',         imageUrl:'', audioUrl:''},
  {id:'fi10',english:'Show me your green card.', russian:'Покажите мне вашу грин-карту.', imageUrl:'', audioUrl:''},
];
