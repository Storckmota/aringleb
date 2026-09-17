// Local QA only: never imported by the production Vite configuration.
const block = (text, extra = {}) => ({_type:'block',style:'normal',children:[{_type:'span',text,marks:[]}],markDefs:[],...extra});
export const articleFixture = {
  _id:'qa.article',_type:'article',title:'The details that make a room work',
  slug:{current:'qa-the-details'},excerpt:'A local layout fixture for reviewing the reading experience. This is test content, not an article for publication.',
  category:'hospitality',publishedAt:'2026-09-14T12:00:00Z',featured:true,outputLanguage:'en',
  coverImage:{asset:{_ref:'image-5977536fbe1a062fd5e25fd26e92162aaab391d3-1200x800-jpg'},alt:'Article layout fixture image'},
  body:[
    block('A room can look complete before it feels ready. This fixture checks a long paragraph with enough text to examine line length, spacing and the way the article reads on a small screen.'),
    block('Attention to the details',{style:'h2'}),
    {...block('Bold and italic text with a link.'),children:[{_type:'span',text:'Bold',marks:['strong']},{_type:'span',text:' and ',marks:[]},{_type:'span',text:'italic',marks:['em']},{_type:'span',text:' text with a link.',marks:['link1']}],markDefs:[{_key:'link1',_type:'link',href:'https://aringleb.com/press/'}]},
    block('A closer look',{style:'h3'}),block('A short quotation from the supplied source.',{style:'blockquote'}),
    block('First consideration',{listItem:'bullet',level:1}),block('A supporting detail',{listItem:'bullet',level:2}),block('Second consideration',{listItem:'bullet',level:1}),
    block('Observe',{listItem:'number',level:1}),block('Review',{listItem:'number',level:1}),
    {_type:'image',asset:{_ref:'image-5977536fbe1a062fd5e25fd26e92162aaab391d3-1200x800-jpg'},alt:'Article layout fixture image repeated in the body',caption:'Local layout fixture.'},
    block('The final paragraph provides a clear end to the article before the original source and sharing links.')
  ],sourceUrl:'https://www.instagram.com/reel/QAfixture/'
};
export const articleFixtures = [articleFixture,{...articleFixture,_id:'qa.article2',slug:{current:'qa-maintenance'},featured:false,title:'Maintenance, service and the everyday work'}];
