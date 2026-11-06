# RDM Website

rdm-site/
├── index.html              public website
├── css/style.css           design (site + admin dono)
├── js/
│   ├── config.js           <- Supabase URL + anon key yahan daalo
│   ├── supabase-client.js  Supabase connection (shared)
│   └── main.js             catalogue load + inquiry form
├── admin/
│   ├── index.html          admin page  ->  aapki-site/admin/
│   └── admin.js            login, categories, products, inquiries
├── assets/logo.png         apna logo yahan rakho (optional)
└── supabase/setup.sql      Supabase SQL Editor mein run karo

## Setup
1. Supabase project banao -> supabase/setup.sql run karo.
2. Authentication > Users > Add user (admin email+password). "Allow new users to sign up" OFF karo.
3. js/config.js mein Project URL + anon public key daalo (service_role kabhi nahi).
4. Poora folder GitHub repo mein upload karo (GitHub Pages).
   Site: https://<user>.github.io/   Admin: https://<user>.github.io/admin/
