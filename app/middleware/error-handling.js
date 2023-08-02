function notFound(req, res) {
    res.sendStatus(404);
}

function serverError(err, req, res) {
    console.log('Server Error Reached');
    console.error(err);

    if (res.headersSent) {
        return;
    }

    let status = err.status ?? 500;

    res.status(status);

    res.json({
        error: err,
    });

    res.sendStatus(500);
}

export { notFound, serverError };
