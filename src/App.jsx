      {/* PLAYER */}
      {playerVisible ? (
        activeTrack?.url ? (
          <BottomPlayer
            mode={playerMode}
            track={activeTrack}
            queue={queue}
            index={idx}
            isPlaying={isPlaying}
            onPlayPause={setIsPlaying}
            onPrev={goPrev}
            onNext={goNext}
            previewSeconds={30}
          />
        ) : (
          <div
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              height: 86,
              background: "rgba(0,0,0,0.35)",
              borderTop: "1px solid rgba(255,255,255,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.75)",
              fontWeight: 900,
            }}
          >
            Select a track to play
          </div>
        )
      ) : null}
