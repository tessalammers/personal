{\rtf1\ansi\ansicpg1252\cocoartf2870
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 export default async function handler(req, res) \{\
  // Enable CORS\
  res.setHeader('Access-Control-Allow-Origin', '*');\
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');\
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');\
\
  if (req.method === 'OPTIONS') \{\
    return res.status(200).end();\
  \}\
\
  const \{ url \} = req.query;\
\
  if (!url) \{\
    return res.status(400).json(\{ error: 'URL parameter is required' \});\
  \}\
\
  try \{\
    // Fetch the recipe page\
    const response = await fetch(url, \{\
      headers: \{\
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'\
      \}\
    \});\
\
    if (!response.ok) \{\
      throw new Error(`HTTP $\{response.status\}`);\
    \}\
\
    const html = await response.text();\
\
    // Extract JSON-LD recipe data\
    const jsonLdMatch = html.match(/<script[^>]*type="application\\/ld\\+json"[^>]*>(.*?)<\\/script>/is);\
\
    if (!jsonLdMatch) \{\
      return res.status(400).json(\{ error: 'Geen recept gevonden op deze pagina' \});\
    \}\
\
    let data = JSON.parse(jsonLdMatch[1]);\
\
    // Handle array response\
    if (Array.isArray(data)) \{\
      data = data.find(item => item['@type'] === 'Recipe' || item.type === 'Recipe');\
      if (!data) \{\
        throw new Error('Geen Recipe gevonden in JSON-LD array');\
      \}\
    \}\
\
    if (data['@type'] !== 'Recipe' && data.type !== 'Recipe') \{\
      throw new Error('Geen Recipe type gevonden');\
    \}\
\
    // Parse recipe\
    const ingredients = (data.recipeIngredient || [])\
      .filter(i => i && typeof i === 'string')\
      .map(i => i.trim())\
      .filter(i => i);\
\
    if (!ingredients.length) \{\
      throw new Error('Geen ingredi\'ebnten gevonden');\
    \}\
\
    const instructions = data.recipeInstructions || [];\
    let prep = '';\
    let cooking = '';\
\
    if (Array.isArray(instructions)) \{\
      instructions.forEach((inst, i) => \{\
        const text = inst.text || inst || '';\
        if (text && i < Math.ceil(instructions.length / 2)) \{\
          prep += text + '\\n';\
        \} else if (text) \{\
          cooking += text + '\\n';\
        \}\
      \});\
    \} else if (instructions.text) \{\
      cooking = instructions.text;\
    \}\
\
    if (!prep) prep = 'Bereid alle ingredi\'ebnten voor.';\
    if (!cooking) throw new Error('Geen bereiding gevonden');\
\
    const servings = parseInt(data.recipeYield?.[0]) || 4;\
    const duration = data.totalTime || 'PT30M';\
    const minutes = parseInt(duration.match(/(\\d+)M/) ? duration.match(/(\\d+)M/)[1] : 30);\
\
    return res.status(200).json(\{\
      name: data.name || 'Recept',\
      servings: servings,\
      time: minutes,\
      ingredients: ingredients,\
      prep: prep.trim(),\
      cooking: cooking.trim()\
    \});\
\
  \} catch (error) \{\
    console.error('Error:', error);\
    return res.status(400).json(\{\
      error: 'Kon recept niet extracten. Zorg dat je een geldige receptpagina hebt gekozen.'\
    \});\
  \}\
\}}