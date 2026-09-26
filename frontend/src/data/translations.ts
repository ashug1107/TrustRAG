import { LanguageType } from '../types';

export interface TranslationDictionary {
  dashboard: string;
  documents: string;
  askKnowledge: string;
  history: string;
  settings: string;
  systemOnline: string;
  uploadDocuments: string;
  askQuestion: string;
  heroHeading: string;
  heroSubheading: string;
  knowledgeDocumentsHeading: string;
  knowledgeDocumentsDesc: string;
  askKnowledgeHeading: string;
  askKnowledgeDesc: string;
  typeQuestionPlaceholder: string;
  suggestedQuestionsTitle: string;
  listening: string;
  transcribing: string;
  queryHistoryHeading: string;
  settingsHeading: string;
  signIn: string;
  signOut: string;
  loginTitle: string;
  loginSubtitle: string;
  usernameLabel: string;
  passwordLabel: string;
  rememberMe: string;
  lightMode: string;
  darkMode: string;
  systemMode: string;
}

export const TRANSLATIONS: Record<LanguageType, TranslationDictionary> = {
  English: {
    dashboard: 'Dashboard',
    documents: 'Documents',
    askKnowledge: 'Ask Knowledge',
    history: 'History',
    settings: 'Settings',
    systemOnline: 'System Online',
    uploadDocuments: '+ Upload Documents',
    askQuestion: 'Ask a Question',
    heroHeading: 'Ask your knowledge base anything.',
    heroSubheading:
      'Upload documents, ask questions using text or voice, and get grounded answers from your knowledge base.',
    knowledgeDocumentsHeading: 'Knowledge Documents',
    knowledgeDocumentsDesc: 'Upload documents that the AI system will use as its knowledge base.',
    askKnowledgeHeading: 'Ask your Knowledge Base',
    askKnowledgeDesc: 'Ask questions about your uploaded documents using text or voice.',
    typeQuestionPlaceholder: 'Type your question about uploaded documents...',
    suggestedQuestionsTitle: 'Suggested Research Questions:',
    listening: 'Listening for voice query...',
    transcribing: 'Transcribing audio speech...',
    queryHistoryHeading: 'Query History',
    settingsHeading: 'Settings & Configuration',
    signIn: 'Sign In',
    signOut: 'Log Out',
    loginTitle: 'Sign In to KnowAI',
    loginSubtitle: '',
    usernameLabel: 'Username or Email',
    passwordLabel: 'Password',
    rememberMe: 'Remember me on this device',
    lightMode: 'Light',
    darkMode: 'Dark',
    systemMode: 'System',
  },
  Hindi: {
    dashboard: 'डैशबोर्ड',
    documents: 'दस्तावेज़',
    askKnowledge: 'ज्ञान खोजें',
    history: 'इतिहास',
    settings: 'सेटिंग्स',
    systemOnline: 'सिस्टम ऑनलाइन',
    uploadDocuments: '+ दस्तावेज़ अपलोड करें',
    askQuestion: 'प्रश्न पूछें',
    heroHeading: 'अपने ज्ञान भंडार से कुछ भी पूछें।',
    heroSubheading:
      'दस्तावेज़ अपलोड करें, टेक्स्ट या आवाज़ से प्रश्न पूछें, और सत्यापित संदर्भों के साथ सटीक उत्तर प्राप्त करें।',
    knowledgeDocumentsHeading: 'ज्ञान दस्तावेज़',
    knowledgeDocumentsDesc: 'वे दस्तावेज़ अपलोड करें जिनका उपयोग प्रणाली ज्ञान आधार के रूप में करेगी।',
    askKnowledgeHeading: 'अपने ज्ञान आधार से पूछें',
    askKnowledgeDesc: 'अपलोड किए गए दस्तावेज़ों के बारे में टेक्स्ट या आवाज़ के माध्यम से प्रश्न पूछें।',
    typeQuestionPlaceholder: 'अपलोड किए गए दस्तावेज़ों के बारे में अपना प्रश्न लिखें...',
    suggestedQuestionsTitle: 'सुझाए गए शोध प्रश्न:',
    listening: 'आवाज़ सुन रहे हैं...',
    transcribing: 'ऑडियो को टेक्स्ट में बदला जा रहा है...',
    queryHistoryHeading: 'प्रश्न इतिहास',
    settingsHeading: 'सेटिंग्स और विन्यास',
    signIn: 'साइन इन करें',
    signOut: 'लॉग आउट',
    loginTitle: 'KnowAI में साइन इन करें',
    loginSubtitle: '',
    usernameLabel: 'उपयोगकर्ता नाम या ईमेल',
    passwordLabel: 'पासवर्ड',
    rememberMe: 'मुझे इस डिवाइस पर याद रखें',
    lightMode: 'लाइट',
    darkMode: 'डार्क',
    systemMode: 'सिस्टम',
  },
  Marathi: {
    dashboard: 'डॅशबोर्ड',
    documents: 'दस्तऐवज',
    askKnowledge: 'ज्ञान विचारा',
    history: 'इतिहास',
    settings: 'सेटिंग्ज',
    systemOnline: 'प्रणाली ऑनलाइन',
    uploadDocuments: '+ दस्तऐवज अपलोड करा',
    askQuestion: 'प्रश्न विचारा',
    heroHeading: 'तुमच्या ज्ञान भांडाराला काहीही विचारा.',
    heroSubheading:
      'दस्तऐवज अपलोड करा, मजकूर किंवा आवाजाने प्रश्न विचारा आणि संदर्भ पुराव्यांसह अचूक उत्तरे मिळवा.',
    knowledgeDocumentsHeading: 'ज्ञान दस्तऐवज',
    knowledgeDocumentsDesc: 'प्रणाली ज्ञान संचयन म्हणून वापरू शकेल असे दस्तऐवज अपलोड करा.',
    askKnowledgeHeading: 'तुमच्या ज्ञान भांडाराला विचारा',
    askKnowledgeDesc: 'अपलोड केलेल्या दस्तऐवजांबद्दल मजकूर किंवा आवाजाद्वारे प्रश्न विचारा.',
    typeQuestionPlaceholder: 'अपलोड केलेल्या दस्तऐवजांबद्दल तुमचा प्रश्न टाइप करा...',
    suggestedQuestionsTitle: 'सुचवलेले संशोधन प्रश्न:',
    listening: 'आवाज ऐकत आहे...',
    transcribing: 'आवाजाचे मजकुरात रुपांतर होत आहे...',
    queryHistoryHeading: 'प्रश्नांचा इतिहास',
    settingsHeading: 'सेटिंग्ज आणि कॉन्फिगरेशन',
    signIn: 'साइन इन करा',
    signOut: 'लॉग आउट',
    loginTitle: 'KnowAI मध्ये साइन इन करा',
    loginSubtitle: '',
    usernameLabel: 'वापरकर्ता नाव किंवा ईमेल',
    passwordLabel: 'पासवर्ड',
    rememberMe: 'मला या डिव्हाइसवर लक्षात ठेवा',
    lightMode: 'लाइट',
    darkMode: 'डार्क',
    systemMode: 'सिस्टम',
  },
};
