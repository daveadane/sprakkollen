Part 2:

https://www.notion.so/utvecklarakademin/Projektarbete-webbramverk-2e76064241a180289b41ecf329688902


1) Create the Vite + React project

C:\Users\davea\Desktop\webbramverk\webbramverk-l2-daveadane

Create a new vite project:
npm create vite@latest frontend

Enter the project:
cd frontend 

Install packages:
npm install

Delete/remove    
App.css

Start the dev server:
npm run dev.



npm install tailwindcss @tailwindcss/vite

Update vite.config.js

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
});


update index.css 
@import "tailwindcss";

npm run dev