import streamlit as st
from ai_engine import ask_ai
from prompts import gap_prompt, fix_prompt
import re

# PDF
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

# ---------- UI CONFIG ----------
st.set_page_config(page_title="AI QA Agent", layout="wide")

st.markdown("""
<style>
    .main {
        background-color: #0e1117;
        color: white;
    }
    textarea {
        background-color: #1e1e1e !important;
        color: white !important;
    }
</style>
""", unsafe_allow_html=True)

st.title("🚀 AI Test Coverage Agent")

# ---------- FUNCTIONS ----------
def extract_function_names(code):
    return re.findall(r'def (\w+)\(', code)

def create_pdf(text):
    doc = SimpleDocTemplate("report.pdf")
    styles = getSampleStyleSheet()
    content = []

    for line in text.split("\n"):
        content.append(Paragraph(line, styles["Normal"]))

    doc.build(content)
    return "report.pdf"

# ---------- INPUT ----------
col1, col2 = st.columns(2)

with col1:
    code_input = st.text_area("💻 Code", height=300)

with col2:
    test_input = st.text_area("🧪 Test Cases", height=300)

# ---------- ANALYZE ----------
if st.button("Analyze"):

    if code_input and test_input:

        with st.spinner("Analyzing with AI..."):

            result = ask_ai(gap_prompt(code_input, test_input))

            st.subheader("📊 AI Gap Analysis Report")

            # Structured output
            for line in result.split("\n"):
                if line.strip():
                    st.markdown(f"- {line}")

            # Save for fix + PDF
            st.session_state["code"] = code_input
            st.session_state["result"] = result

    else:
        st.warning("Please paste both code and test cases")

# ---------- FIX SECTION ----------
if "code" in st.session_state:

    st.subheader("🛠 Generate Fix")

    functions = extract_function_names(st.session_state["code"])

    if functions:
        function_name = st.selectbox("Select function", functions)
    else:
        function_name = st.text_input("Enter function name")

    if st.button("Fix"):

        if function_name:

            with st.spinner("Generating test cases..."):

                fix = ask_ai(
                    fix_prompt(function_name, st.session_state["code"])
                )

                st.subheader("✅ Suggested Test Cases")
                st.code(fix, language="python")

        else:
            st.warning("Please enter/select function name")

# ---------- DOWNLOAD PDF ----------
if "result" in st.session_state:

    pdf_file = create_pdf(st.session_state["result"])

    with open(pdf_file, "rb") as f:
        st.download_button(
            label="📄 Download Report",
            data=f,
            file_name="AI_Report.pdf",
            mime="application/pdf"
        )