import { createContext, useContext, useState, useEffect } from 'react';

// ============ TRANSLATION STRINGS ============
// Every UI string in both languages. To change wording later, edit here only.
export const STRINGS = {
  mn: {
    // Navigation
    nav_home: 'Нүүр',
    nav_pricing: 'Үнэ',
    nav_about: 'Бидний тухай',
    nav_signin: 'Нэвтрэх',
    nav_signup: 'Бүртгүүлэх',
    nav_getstarted: 'Эхлэх',
    nav_openapp: 'Аппликейшн нээх',

    // Landing — hero
    hero_badge: 'Туршилтын хувилбар — бүгдэд үнэгүй',
    hero_title_1: 'Таны гар бичмэл,',
    hero_title_2: 'фонт болж хувирна.',
    hero_subtitle: 'Үсгээ нэг удаа зур. Үүрд ашигла. Ямар ч төхөөрөмж дээр, ямар ч баримтад өөрийн гараар бич.',
    hero_cta_primary: 'Үнэгүй эхлэх',
    hero_cta_secondary: 'Үнэ үзэх',
    hero_cta_open: 'Аппликейшн нээх',
    hero_microtrust: 'Картын мэдээлэл шаардахгүй · Утас, компьютер дээр ажиллана · Үүлэн санд хадгална',
    hero_mockup: 'Inkly ажлын талбар — зур, хадгал, бич',

    // Landing — features
    features_kicker: 'Бүх хэрэгцээт зүйл',
    features_title: 'Хөтчид суугаа бүрэн цех.',
    features_subtitle: 'Программ суулгах шаардлагагүй. Тусгай төхөөрөмж хэрэггүй. Зүгээр л зур, хадгал, фонт чинь бэлэн.',
    feat_1_title: 'Даралт мэдрэх зураг',
    feat_1_desc: 'Зурвас бүр таны хурд, даралтад хариу үзүүлнэ. Дээш татахад нарийн, доош татахад бүдүүн. Жинхэнэ үзэг шиг.',
    feat_2_title: 'Бүртгэлд хадгална',
    feat_2_desc: 'Ямар ч төхөөрөмжөөс нэвтрэхэд таны үсэг хүлээж байна. Утас, таблет, зөөврийн компьютер — ажил чинь хамт явна.',
    feat_3_title: 'Шууд урьдчилан харах',
    feat_3_desc: 'Тэмдэглэлдээ ямар ч текст бичээд гар бичмэлээрээ шууд харагдахыг хар.',
    feat_4_title: 'Ухаалаг үсгийн зай',
    feat_4_desc: 'Үсгүүд тусдаа дөрвөлжин биш, урсгал үг болж холбогдоно. Нэг гар бичмэл мэт уншигдана.',
    feat_5_title: 'Хаашаа ч экспортлох',
    feat_5_desc: 'Бүтэн цагаан толгойгоо хэвлэх хуудас болгон татаж ав. Баримт, дизайнд ашигла.',
    feat_6_title: 'Танд зориулж хийсэн',
    feat_6_desc: 'Тэмдэглэлдээ өөрийн гар бичмэлийг хүссэн Монгол оюутны бүтээл. Хувийн зүйлийг үнэлдэг хүн бүрт.',

    // Landing — how it works
    how_kicker: 'Хэрхэн ажилладаг вэ',
    how_title: 'Гурван алхам. Фонт чинь бэлэн.',
    how_1_title: 'Үсгээ зур',
    how_1_desc: 'Засварлагчийг нээж А-аас Я хүртэл, тоонуудыг зур. Яарах хэрэггүй — дахин зурж болно.',
    how_2_title: 'Амьдрахыг нь хар',
    how_2_desc: 'Үсэг хадгалах тусам тэмдэглэлд бичээд гар бичмэлээ жинхэнэ өгүүлбэрт хар.',
    how_3_title: 'Хаа ч ашигла',
    how_3_desc: 'Цагаан толгойгоо экспортло эсвэл үүлэн санд хадгал. Ямар ч төхөөрөмжөөс нэвтэрч үргэлжлүүл.',

    // Landing — testimonials
    test_title: 'Бичдэг хүмүүст хайртай.',
    test_subtitle: 'Тэмдэглэл бичигчдээс дизайнер хүртэл — хуудсан дээр өөрийн ул мөрийг үлдээхийг хүссэн бүхэнд.',

    // Landing — final CTA
    cta_title: 'Фонтоо хийхэд бэлэн үү?',
    cta_subtitle: 'Үнэгүй эхэл. Карт хэрэггүй. Минут хүрэхгүй хугацаанд эхний үсгээ зурна.',
    cta_button: 'Үнэгүй эхлэх',
    cta_button_open: 'Аппликейшнд үргэлжлүүлэх',

    // Pricing
    pricing_badge: 'Туршилтын үед үнэгүй',
    pricing_title: 'Энгийн, шударга үнэ.',
    pricing_subtitle: 'Үнэгүй эхэл. Хэрэгтэй үед нь шинэчил — зөвхөн тэр үед. Заль мэх, нуугдмал төлбөргүй.',
    plan_free_name: 'Үнэгүй',
    plan_free_tagline: 'Сониуч бүтээгчдэд',
    plan_free_period: 'үүрд',
    plan_pro_name: 'Pro',
    plan_pro_tagline: 'Нухацтай бичигчдэд',
    plan_pro_period: 'сар бүр',
    plan_pro_badge: 'Хамгийн алдартай',
    plan_team_name: 'Баг',
    plan_team_tagline: 'Студи, сургуульд',
    plan_team_period: 'хэрэглэгч / сар',
    plan_cta_free: 'Үнэгүй эхлэх',
    plan_cta_open: 'Аппликейшн нээх',
    plan_cta_soon: 'Удахгүй',
    plan_cta_contact: 'Холбоо барих',
    faq_kicker: 'Түгээмэл асуулт',
    faq_title: 'Асуултууд, хариулттай.',

    // About
    about_badge: 'Улаанбаатарт бүтээв',
    about_title_1: 'Жижиг хэрэгсэл,',
    about_title_2: 'анхааралтай бүтээсэн.',
    about_subtitle: 'Inkly бол стартап биш. Энэ бол төсөл — нэг хүний дижитал хуудсанд өөрийнхөө хэсгийг буцааж оруулах оролдлого.',
    about_values_kicker: 'Бидний итгэл үнэмшил',
    about_values_title: 'Өөр төрлийн программ хангамж.',
    about_contact_title: 'Асуулт байна уу?',
    about_contact_desc: 'Би и-мэйл болгоныг өөрөө уншдаг. Юу хийж байгаагаа, юу сайжруулахыг хүсэж байгаагаа, эсвэл зүгээр сайн уу гэж бичээрэй.',
    about_try_title: 'Inkly-г өөрөө туршаад үз.',
    about_try_desc: 'Inkly юу болохыг ойлгох хамгийн хурдан арга — эхний үсгээ зур.',

    // Auth
    auth_back: 'Нүүр хуудас руу',
    auth_signin_title: 'Тавтай морилно уу',
    auth_signup_title: 'Бүртгэл үүсгэх',
    auth_signin_sub: 'Үсгээ үргэлжлүүлэхийн тулд нэвтэрнэ үү.',
    auth_signup_sub: 'Минут хүрэхгүй хугацаанд фонтоо зурж эхэл.',
    auth_email: 'И-мэйл хаяг',
    auth_password: 'Нууц үг',
    auth_password_hint: 'Хамгийн багадаа 6 тэмдэгт.',
    auth_signin_btn: 'Нэвтрэх',
    auth_signup_btn: 'Бүртгэл үүсгэх',
    auth_working: 'Боловсруулж байна…',
    auth_have_account: 'Бүртгэлтэй юу?',
    auth_no_account: 'Inkly-д шинэ хэрэглэгч үү?',
    auth_to_signin: 'Нэвтрэх',
    auth_to_signup: 'Бүртгэл үүсгэх',
    auth_check_email: 'И-мэйлээ шалгана уу — бид баталгаажуулах холбоос илгээлээ.',
    auth_terms_1: 'үргэлжлүүлснээр та манай',
    auth_terms_signin: 'нэвтэрснээр та манай',
    auth_terms_signup: 'бүртгэл үүсгэснээр та манай',
    auth_terms_link: 'Үйлчилгээний нөхцөл',
    auth_privacy_link: 'Нууцлалын бодлого',
    auth_terms_and: 'болон',
    auth_terms_agree: '-той зөвшөөрч байна.',

    // App workspace
    app_workspace: 'Ажлын талбар',
    app_editor: 'Үсэг засварлагч',
    app_notebook: 'Тэмдэглэлийн дэвтэр',
    app_uppercase: 'Том үсэг',
    app_lowercase: 'Жижиг үсэг',
    app_numbers: 'Тоо',
    app_export_alphabet: 'Цагаан толгой экспортлох',
    app_signed_in_as: 'Нэвтэрсэн',
    app_marketing_site: 'Маркетингийн сайт',
    app_signout: 'Гарах',
    app_letter: 'Үсэг',
    app_saved: 'Хадгалсан',
    app_in_alphabet: 'Цагаан толгойд байна',
    app_clear: 'Цэвэрлэх',
    app_erase: 'Устгах',
    app_resize: 'Хэмжээ',
    app_save: 'Хадгалах',
    app_done_size: 'Болсон — Хэмжээ хэрэглэх',
    app_nib: 'Үзэгний зузаан',
    app_ink: 'Бэхний тунгалаг',
    app_write: 'Бичих',
    app_preview: 'Урьдчилан харах',
    app_notebook_title: 'Тэмдэглэлийн дэвтэр',
    app_notebook_sub: 'Зүүн талд бич — таны үсгүүд баруун талд гарч ирнэ.',
    app_controls: 'Тэмдэглэлийн тохиргоо',
    app_export_png: 'PNG экспорт',
    app_size: 'Хэмжээ',
    app_letter_sp: 'Үсгийн зай',
    app_word_sp: 'Үгийн зай',
    app_line_height: 'Мөрийн өндөр',
    app_paper: 'Цаас',
    app_paper_blank: 'Хоосон',
    app_paper_lined: 'Шугаман',
    app_paper_dotted: 'Цэгэн',
    app_paper_grid: 'Тор',
    app_color: 'Өнгө',
    app_color_hint: 'Текст сонгоод өнгө сонгоно уу',
    app_clear_text: 'Текст цэвэрлэх',
    app_export_pdf: 'PDF татах',
    app_save_note: 'Тэмдэглэл хадгалах',
    app_note_saved: 'Тэмдэглэл хадгалагдлаа',
    app_note_loaded: 'Хадгалсан тэмдэглэл ачаалагдлаа',
    app_saving: 'Хадгалж байна…',
    app_download: 'Татах',
    app_documents: 'Баримтууд',
    app_new_document: 'Шинэ баримт',
    app_doc_create: 'Үүсгэх',
    app_doc_open: 'Нээх',
    app_doc_rename: 'Нэр солих',
    app_doc_delete: 'Устгах',
    app_doc_delete_confirm: 'Энэ баримтыг устгах уу? Буцаах боломжгүй.',
    app_back_to_docs: 'Баримтууд руу',
    app_docs_empty: 'Танд одоогоор баримт алга. Шинэ баримт үүсгэнэ үү.',
    app_cancel: 'Болих',
    app_doc_title_label: 'Баримтын нэр',
    app_doc_save: 'Баримт хадгалах',
    app_doc_saved: 'Хадгалагдлаа',
    app_page: 'Хуудас',
    app_add_page: 'Хуудас нэмэх',
    app_delete_page: 'Хуудас устгах',
    app_delete_page_confirm: 'Энэ хуудсыг устгах уу?',
    app_page_of: '/',
    app_choose_template: 'Загвар сонгох',
    tpl_blank: 'Хоосон',
    tpl_blank_desc: 'Цэвэр хуудаснаас эхэл',
    tpl_letter: 'Захидал',
    tpl_letter_desc: 'Огноо, мэндчилгээ, гарын үсэг',
    tpl_diary: 'Өдрийн тэмдэглэл',
    tpl_diary_desc: 'Өдрийн огноо ба бодол',
    tpl_essay: 'Эссэ',
    tpl_essay_desc: 'Гарчиг, удиртгал, дүгнэлт',
    tpl_poem: 'Шүлэг',
    tpl_poem_desc: 'Богино мөрүүд, чөлөөт хэлбэр',
    tpl_letter_body: 'Огноо: ____________\n\nЭрхэм хүндэт ____________,\n\n\n\n\nХүндэтгэсэн,\n____________',
    tpl_diary_body: '____ оны ____ сарын ____\n\nӨнөөдөр...',
    tpl_essay_body: 'Гарчиг: ____________\n\nУдиртгал:\n\n\nҮндсэн хэсэг:\n\n\nДүгнэлт:',
    tpl_poem_body: '____________\n\n____________\n\n____________',
    app_doc_header: 'Баримтын толгой (заавал биш)',
    app_doc_header_ph: 'Жишээ: Таны нэр эсвэл гарчиг',
    app_chars: 'тэмдэгт',
    app_words: 'үг',
    app_empty_hint: 'Хоосон — зүүн талд бичээд гар бичмэлээ хар…',
    app_no_glyphs: 'Засварлагчид үсэг зураад энд хар.',
    app_loading: 'Ачааллаж байна…',
    app_draw_hint_cap: 'Дээд шугамаас доод шугам хүртэл зур',
    app_draw_hint_x: 'Дунд шугамаас доод шугам хүртэл зур',
    app_draw_hint_asc: 'Иш дээд шугам хүртэл, бие дунд хэсэгт',
    app_draw_hint_desc: 'Бие дунд хэсэгт, сүүл доош',

    // Notebook sample text
    notebook_sample: 'Эрхэм найз минь,\n\nЭнэ захидлыг өөрийн гараар бичиж байна. Үг бүхэн — миний өөрийн.',

    // Footer
    footer_tagline: 'Гар бичмэлээ үзэсгэлэнтэй фонт болго. Цагаан толгойгоо зурж, үүрд хадгалж, хаа ч өөрийн гараар бич.',
    footer_product: 'Бүтээгдэхүүн',
    footer_resources: 'Нөөц',
    footer_legal: 'Эрх зүй',
    footer_copyright: 'Inkly. Улаанбаатарт хайраар бүтээв.',
    footer_motto: 'Таны гар бичмэл, таны фонт, таны үгс.',

    // Common
    common_back_home: '← Нүүр хуудас руу',
  },

  en: {
    nav_home: 'Home',
    nav_pricing: 'Pricing',
    nav_about: 'About',
    nav_signin: 'Sign in',
    nav_signup: 'Sign up',
    nav_getstarted: 'Get started',
    nav_openapp: 'Open app',

    hero_badge: 'Now in early access — free for everyone',
    hero_title_1: 'Your handwriting,',
    hero_title_2: 'made into a font.',
    hero_subtitle: 'Draw your alphabet once. Use it forever. Write anywhere in your own hand, on any device, in any document.',
    hero_cta_primary: 'Start for free',
    hero_cta_secondary: 'See pricing',
    hero_cta_open: 'Open the app',
    hero_microtrust: 'No credit card required · Works on phone and computer · Saved in the cloud',
    hero_mockup: 'The Inkly workspace — draw, save, write',

    features_kicker: 'Everything you need',
    features_title: 'A complete workshop in your browser.',
    features_subtitle: 'No software to install. No special hardware. Just draw, save, and your font is ready.',
    feat_1_title: 'Pressure-sensitive drawing',
    feat_1_desc: 'Each stroke responds to your speed and pressure. Thin on the upstroke, thick on the down. Just like a real pen.',
    feat_2_title: 'Saves to your account',
    feat_2_desc: 'Sign in on any device, and your alphabet is waiting. Phone, tablet, laptop — your work follows you.',
    feat_3_title: 'Live preview',
    feat_3_desc: 'Type any text in the notebook and watch it appear in your handwriting instantly.',
    feat_4_title: 'Smart letter spacing',
    feat_4_desc: 'Letters connect into flowing words, not stamped boxes. Reads as one continuous hand.',
    feat_5_title: 'Export anywhere',
    feat_5_desc: 'Download your full alphabet as a printable sheet. Use it in documents or designs.',
    feat_6_title: 'Made for you',
    feat_6_desc: 'Built by a Mongolian student who wanted his own handwriting in his notes. For anyone who values the personal.',

    how_kicker: 'How it works',
    how_title: 'Three steps. Your font is ready.',
    how_1_title: 'Draw your letters',
    how_1_desc: 'Open the editor and draw A through Z, plus numbers. Take your time — you can always redo.',
    how_2_title: 'Watch it come alive',
    how_2_desc: 'As you save letters, type in the notebook to see your handwriting in real sentences.',
    how_3_title: 'Use it anywhere',
    how_3_desc: 'Export your alphabet or keep it in the cloud. Sign in on any device to keep writing.',

    test_title: 'Loved by people who write.',
    test_subtitle: 'From note-takers to designers, anyone who wants their own touch on the page.',

    cta_title: 'Ready to make your font?',
    cta_subtitle: 'Free to start. No card required. You will be drawing your first letter in under a minute.',
    cta_button: 'Get started for free',
    cta_button_open: 'Continue in the app',

    pricing_badge: 'Free during early access',
    pricing_title: 'Simple, honest pricing.',
    pricing_subtitle: 'Start free. Upgrade when you need more — and only then. No tricks, no hidden charges.',
    plan_free_name: 'Free',
    plan_free_tagline: 'For curious creators',
    plan_free_period: 'forever',
    plan_pro_name: 'Pro',
    plan_pro_tagline: 'For serious writers',
    plan_pro_period: 'per month',
    plan_pro_badge: 'Most popular',
    plan_team_name: 'Team',
    plan_team_tagline: 'For studios & schools',
    plan_team_period: 'per user / month',
    plan_cta_free: 'Start for free',
    plan_cta_open: 'Open the app',
    plan_cta_soon: 'Coming soon',
    plan_cta_contact: 'Contact us',
    faq_kicker: 'Frequently asked',
    faq_title: 'Questions, answered.',

    about_badge: 'Built in Ulaanbaatar, Mongolia',
    about_title_1: 'A small tool,',
    about_title_2: 'made with care.',
    about_subtitle: 'Inkly is not a startup. It is a project — one person trying to put a piece of themselves back into the digital page.',
    about_values_kicker: 'What we believe',
    about_values_title: 'A different kind of software.',
    about_contact_title: 'Have a question?',
    about_contact_desc: 'I read every email personally. Tell me what you are making, what you wish worked better, or just say hello.',
    about_try_title: 'Try Inkly yourself.',
    about_try_desc: 'The fastest way to understand Inkly — draw your first letter.',

    auth_back: 'Back to home',
    auth_signin_title: 'Welcome back',
    auth_signup_title: 'Create your account',
    auth_signin_sub: 'Sign in to continue with your alphabet.',
    auth_signup_sub: 'Start drawing your font in under a minute.',
    auth_email: 'Email address',
    auth_password: 'Password',
    auth_password_hint: 'Minimum 6 characters.',
    auth_signin_btn: 'Sign in',
    auth_signup_btn: 'Create account',
    auth_working: 'Working…',
    auth_have_account: 'Already have an account?',
    auth_no_account: 'New to Inkly?',
    auth_to_signin: 'Sign in',
    auth_to_signup: 'Create an account',
    auth_check_email: 'Check your email — we sent a confirmation link.',
    auth_terms_1: 'by continuing, you agree to our',
    auth_terms_signin: 'by signing in, you agree to our',
    auth_terms_signup: 'by creating an account, you agree to our',
    auth_terms_link: 'Terms',
    auth_privacy_link: 'Privacy Policy',
    auth_terms_and: 'and',
    auth_terms_agree: '.',

    app_workspace: 'Workspace',
    app_editor: 'Letter Editor',
    app_notebook: 'Notebook',
    app_uppercase: 'Uppercase',
    app_lowercase: 'Lowercase',
    app_numbers: 'Numbers',
    app_export_alphabet: 'Export alphabet',
    app_signed_in_as: 'Signed in as',
    app_marketing_site: 'Marketing site',
    app_signout: 'Sign out',
    app_letter: 'Letter',
    app_saved: 'Saved',
    app_in_alphabet: 'In your alphabet',
    app_clear: 'Clear',
    app_erase: 'Erase',
    app_resize: 'Resize',
    app_save: 'Save',
    app_done_size: 'Done — Apply Size',
    app_nib: 'Nib thickness',
    app_ink: 'Ink opacity',
    app_write: 'Write',
    app_preview: 'Preview',
    app_notebook_title: 'Notebook',
    app_notebook_sub: 'Write on the left — your custom letters appear on the right.',
    app_controls: 'Notebook controls',
    app_export_png: 'Export PNG',
    app_size: 'Size',
    app_letter_sp: 'Letter sp.',
    app_word_sp: 'Word sp.',
    app_line_height: 'Line height',
    app_paper: 'Paper',
    app_paper_blank: 'Blank',
    app_paper_lined: 'Lined',
    app_paper_dotted: 'Dotted',
    app_paper_grid: 'Grid',
    app_color: 'Color',
    app_color_hint: 'Select text, then pick a color',
    app_clear_text: 'Clear text',
    app_export_pdf: 'Download PDF',
    app_save_note: 'Save note',
    app_note_saved: 'Note saved',
    app_note_loaded: 'Saved note loaded',
    app_saving: 'Saving…',
    app_download: 'Download',
    app_documents: 'Documents',
    app_new_document: 'New document',
    app_doc_create: 'Create',
    app_doc_open: 'Open',
    app_doc_rename: 'Rename',
    app_doc_delete: 'Delete',
    app_doc_delete_confirm: 'Delete this document? This cannot be undone.',
    app_back_to_docs: 'Documents',
    app_docs_empty: 'You have no documents yet. Create a new one.',
    app_cancel: 'Cancel',
    app_doc_title_label: 'Document name',
    app_doc_save: 'Save document',
    app_doc_saved: 'Saved',
    app_page: 'Page',
    app_add_page: 'Add page',
    app_delete_page: 'Delete page',
    app_delete_page_confirm: 'Delete this page?',
    app_page_of: '/',
    app_choose_template: 'Choose a template',
    tpl_blank: 'Blank',
    tpl_blank_desc: 'Start from an empty page',
    tpl_letter: 'Letter',
    tpl_letter_desc: 'Date, greeting, signature',
    tpl_diary: 'Diary',
    tpl_diary_desc: 'Date header and a thought',
    tpl_essay: 'Essay',
    tpl_essay_desc: 'Title, intro, conclusion',
    tpl_poem: 'Poem',
    tpl_poem_desc: 'Short lines, free form',
    tpl_letter_body: 'Date: ____________\n\nDear ____________,\n\n\n\n\nSincerely,\n____________',
    tpl_diary_body: '____ / ____ / ____\n\nToday...',
    tpl_essay_body: 'Title: ____________\n\nIntroduction:\n\n\nBody:\n\n\nConclusion:',
    tpl_poem_body: '____________\n\n____________\n\n____________',
    app_doc_header: 'Document header (optional)',
    app_doc_header_ph: 'e.g. Your name or a title',
    app_chars: 'chars',
    app_words: 'words',
    app_empty_hint: 'Empty — type on the left to see your hand…',
    app_no_glyphs: 'Draw some letters in the editor to see them here.',
    app_loading: 'Loading…',
    app_draw_hint_cap: 'Draw between the cap line and baseline',
    app_draw_hint_x: 'Draw between the x-height line and baseline',
    app_draw_hint_asc: 'Stem to the cap line, body at x-height',
    app_draw_hint_desc: 'Body at x-height, tail below baseline',

    notebook_sample: 'Dear friend,\n\nI am writing this in my own hand. The words flow together — each curve is mine.',

    footer_tagline: 'Turn your handwriting into a beautiful font. Draw your alphabet, save it forever, and write anywhere in your own hand.',
    footer_product: 'Product',
    footer_resources: 'Resources',
    footer_legal: 'Legal',
    footer_copyright: 'Inkly. Made with care in Ulaanbaatar.',
    footer_motto: 'Your handwriting, your font, your words.',

    common_back_home: '← Back to home',
  },
};

// ============ LANGUAGE CONTEXT ============
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('mn'); // Mongolian default

  // On first load, read saved preference
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('inkly_lang');
      if (saved === 'mn' || saved === 'en') {
        setLangState(saved);
      }
    } catch (e) {
      // localStorage may be unavailable; ignore
    }
  }, []);

  const setLang = (next) => {
    setLangState(next);
    try {
      window.localStorage.setItem('inkly_lang', next);
    } catch (e) {
      // ignore
    }
  };

  const toggle = () => setLang(lang === 'mn' ? 'en' : 'mn');

  // Translation function
  const t = (key) => {
    const table = STRINGS[lang] || STRINGS.mn;
    return table[key] !== undefined ? table[key] : key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback if used outside provider — return Mongolian, no-op setters
    return {
      lang: 'mn',
      setLang: () => {},
      toggle: () => {},
      t: (key) => (STRINGS.mn[key] !== undefined ? STRINGS.mn[key] : key),
    };
  }
  return ctx;
}
