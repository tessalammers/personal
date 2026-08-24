{\rtf1\ansi\ansicpg1252\cocoartf2870
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 export const handler = async (event) => \{\
  // Enable CORS\
  const headers = \{\
    'Access-Control-Allow-Origin': '*',\
    'Access-Control-Allow-Methods': 'GET, OPTIONS',\
    'Access-Control-Allow-Headers': 'Content-Type',\
    'Content-Type': 'application/json'\
  \};\
\
  if (event.httpMethod === 'OPTIONS') \{\
    return \{ statusCode: 200, headers \};\
  \}\
\
  const url = event.queryStringParameters?.url;\
\
  if (!url) \{\
    return \{\
      statusCode: 400,\
      headers,\
      body: JSON.stringify(\{ error: 'URL parameter is required' \})\
    \};\
  \}\
\
  try \{\
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
    const jsonLdMatch = html.match(/<script[^>]*type="application\\/ld\\+json"[^>]*>(.*?)<\\/script>/is);\
\
    if (!jsonLdMatch) \{\
      return \{\
        statusCode: 400,\
        headers,\
        body: JSON.stringify(\{ error: 'Geen recept gevonden op deze pagina' \})\
      \};\
    \}\
\
    let data = JSON.parse(jsonLdMatch[1]);\
\
    if (Array.isArray(data)) \{\
      data = data.find(item => item['@type'] === 'Recipe' || item.type === 'Recipe');\
      if (!data) \{\
        throw new Error('Geen Recipe gevonden');\
      \}\
    \}\
\
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
    return \{\
      statusCode: 200,\
      headers,\
      body: JSON.stringify(\{\
        name: data.name || 'Recept',\
        servings: servings,\
        time: minutes,\
        ingredients: ingredients,\
        prep: prep.trim(),\
        cooking: cooking.trim()\
      \})\
    \};\
\
  \} catch (error) \{\
    console.error('Error:', error);\
    return \{\
      statusCode: 400,\
      headers,\
      body: JSON.stringify(\{\
        error: 'Kon recept niet extracten. Zorg dat je een geldige receptpagina hebt gekozen.'\
      \})\
    \};\
  \}\
\};}