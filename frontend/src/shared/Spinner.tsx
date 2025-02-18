import React from 'react'

interface Props {
    width?: string
    height?: string;
    color?: string;
    borderWidth?: string;
}

const Spinner = (props: Props) => {
    const { width = "55px", height = "55px", borderWidth = "5px" } = props


    const loaderStyle: React.CSSProperties = {
        width: width,
        height: height,
        border: `${borderWidth} solid #81aef1`,
        borderBottomColor: "#184180",
        borderRadius: "50%",
        display: "inline-block",
        boxSizing: "border-box",
        animation: "rotation 1s linear infinite",
    }

    const keyframes = `
    @keyframes rotation {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;

    return (
        <>
            <style>{keyframes}</style>
            <span style={loaderStyle}></span>
        </>
    )
}

export default Spinner